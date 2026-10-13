import React, { useState, useEffect, useRef } from 'react';
import type { Issue } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { issueKeys, projectKeys, favoriteKeys } from '@/api';
import { updateUser } from '@/api/users';
import {
  DashboardSummaryToolbar,
  DashboardWidgetGrid,
  DashboardWidgetAddModal,
  getWidgetDefinition,
} from '@/components/dashboard';
import { useDashboardStore } from '@/stores/useDashboardStore';

interface DashboardPageProps {
  onNavigate: (tab: any, projectId?: number | null) => void;
  onOpenCreateIssue: () => void;
  onOpenCreateProject: () => void;
  onSelectIssue?: (issue: Issue) => void;
  onOpenAuth?: () => void;
  refreshKey?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCreateIssue,
  onOpenCreateProject,
  onSelectIssue,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dashboard Store Hooks
  const widgets = useDashboardStore((s) => s.widgets);
  const isAddModalOpen = useDashboardStore((s) => s.isAddModalOpen);
  const closeAddModal = useDashboardStore((s) => s.closeAddModal);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const editingWidgetIdForConfig = useDashboardStore((s) => s.editingWidgetIdForConfig);
  const closeWidgetConfigModal = useDashboardStore((s) => s.closeWidgetConfigModal);
  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);
  const loadFromUserPreferences = useDashboardStore((s) => s.loadFromUserPreferences);

  // 1. Initial Load from Backend Preferences on Login
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && user?.preferences && !hasLoadedRef.current) {
      loadFromUserPreferences(user.preferences);
      hasLoadedRef.current = true;
    }
  }, [isAuthenticated, user?.preferences, loadFromUserPreferences]);

  // 2. Debounced Sync with Backend on Widget Changes (Authenticated Users Only)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isAuthenticated || !user) return;

    const timer = setTimeout(async () => {
      try {
        let existingPref: Record<string, any> = {};
        try {
          existingPref = JSON.parse(user.preferences || '{}');
        } catch {
          existingPref = {};
        }

        const updatedPref = {
          ...existingPref,
          dashboardConfig: {
            version: 1,
            widgets,
          },
        };

        await updateUser(user.id, {
          preferences: JSON.stringify(updatedPref),
        });
      } catch (err) {
        console.warn('[DashboardPage] Failed to sync dashboard config to backend:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [widgets, isAuthenticated, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: issueKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Find currently editing widget for config modal
  const editingWidget = widgets.find((w) => w.id === editingWidgetIdForConfig);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      className={`animate-fade-in ${isRefreshing ? 'transition-pending' : ''}`}
    >
      {/* 1. Top Summary Toolbar */}
      <DashboardSummaryToolbar
        isAuthenticated={isAuthenticated}
        user={user}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
        onOpenCreateIssue={onOpenCreateIssue}
        onOpenCreateProject={onOpenCreateProject}
        onOpenAuth={onOpenAuth}
      />

      {/* 2. 12-Column Responsive Customizable Widget Grid */}
      <DashboardWidgetGrid
        onNavigate={onNavigate}
        onSelectIssue={onSelectIssue}
        onOpenAuth={onOpenAuth}
      />

      {/* 3. Add Widget Catalog Modal */}
      <DashboardWidgetAddModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onAddWidget={addWidget}
      />

      {/* 4. Widget Config Modal (동적 레지스트리 기반) */}
      {(() => {
        if (!editingWidgetIdForConfig || !editingWidget) return null;
        const widgetDef = getWidgetDefinition(editingWidget.type);
        if (!widgetDef || !widgetDef.ConfigModal) return null;
        const ConfigModalComponent = widgetDef.ConfigModal;
        return (
          <ConfigModalComponent
            isOpen={true}
            onClose={closeWidgetConfigModal}
            config={editingWidget.config}
            onSave={(newConfig) => {
              if (editingWidgetIdForConfig) {
                updateWidgetConfig(editingWidgetIdForConfig, newConfig);
              }
            }}
          />
        );
      })()}
    </div>
  );
};

export default DashboardPage;