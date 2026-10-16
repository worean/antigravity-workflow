import React, { useState } from 'react';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import { AvatarCropModal } from '@/components/AvatarCropModal';
import {
  SettingsHeaderToolbar,
  SettingsSidebarNav,
  SettingsProfileTab,
  SettingsWorkspaceTab,
  SettingsOrgTab,
  SettingsCustomFieldsTab,
  SettingsDisplayTab,
  SettingsSystemTab,
} from '@/components/settings';
import { useSettingsPageData } from '@/components/settings/useSettingsPageData';
import { GitPluginSettingTab } from '@/components/plugins/git';

interface SettingsPageProps {
  onOpenAuth?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const s = useSettingsPageData();
  const [showCropModal, setShowCropModal] = useState<boolean>(false);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {/* 1. Top Header */}
      <SettingsHeaderToolbar />

      {/* 2. Main 2-Column Settings Layout */}
      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>
        {/* Left Sub-Tab Menu */}
        <SettingsSidebarNav
          activeSubTab={s.activeSubTab}
          setActiveSubTab={s.setActiveSubTab}
        />

        {/* Right Content Panel */}
        <div
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '16px 20px',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {s.activeSubTab === 'profile' && (
            <SettingsProfileTab
              user={s.user}
              name={s.name}
              setName={s.setName}
              email={s.email}
              avatar={s.avatar}
              setAvatar={s.setAvatar}
              avatarColor={s.avatarColor}
              setAvatarColor={s.setAvatarColor}
              bio={s.bio}
              setBio={s.setBio}
              department={s.department}
              setDepartment={s.setDepartment}
              jobTitle={s.jobTitle}
              setJobTitle={s.setJobTitle}
              profileSuccessMsg={s.profileSuccessMsg}
              loadingProfile={s.loadingProfile}
              isPending={s.isPending}
              handleSaveProfile={s.handleSaveProfile}
              loadProfileData={s.loadProfileData}
              setSelectedGroupId={s.setSelectedGroupId}
              setActiveSubTab={s.setActiveSubTab}
              onOpenCropModal={(img, fName) => {
                s.setCropTarget({ src: img, fileName: fName });
                setShowCropModal(true);
              }}
            />
          )}

          {s.activeSubTab === 'workspace' && <SettingsWorkspaceTab />}

          {s.activeSubTab === 'organization' && (
            <SettingsOrgTab
              isAuthenticated={s.isAuthenticated}
              user={s.user}
              treeGroups={s.treeGroups}
              flatGroups={s.flatGroups}
              loadingGroups={s.loadingGroups}
              selectedGroupId={s.selectedGroupId}
              setSelectedGroupId={s.setSelectedGroupId}
              expandedGroupIds={s.expandedGroupIds}
              setExpandedGroupIds={s.setExpandedGroupIds}
              allUsers={s.allUsers}
              showGroupForm={s.showGroupForm}
              setShowGroupForm={s.setShowGroupForm}
              groupParentId={s.groupParentId}
              setGroupParentId={s.setGroupParentId}
              showMemberForm={s.showMemberForm}
              setShowMemberForm={s.setShowMemberForm}
              newMemberUserId={s.newMemberUserId}
              setNewMemberUserId={s.setNewMemberUserId}
              newMemberRole={s.newMemberRole}
              setNewMemberRole={s.setNewMemberRole}
              newMemberTitle={s.newMemberTitle}
              setNewMemberTitle={s.setNewMemberTitle}
              isPending={s.isPending}
              onGroupCreated={s.handleGroupCreated}
              handleDeleteGroup={s.handleDeleteGroup}
              handleAddMember={s.handleAddMemberToGroup}
              handleUpdateMemberRole={s.handleUpdateMemberRole}
              handleRemoveMember={s.handleRemoveMemberFromGroup}
            />
          )}

          {s.activeSubTab === 'customFields' && (
            <SettingsCustomFieldsTab
              isAuthenticated={s.isAuthenticated}
              customFields={s.customFields}
              loadingFields={s.loadingFields}
              showFieldForm={s.showFieldForm}
              setShowFieldForm={s.setShowFieldForm}
              fieldKey={s.fieldKey}
              setFieldKey={s.setFieldKey}
              fieldName={s.fieldName}
              setFieldName={s.setFieldName}
              fieldType={s.fieldType}
              setFieldType={s.setFieldType}
              fieldDesc={s.fieldDesc}
              setFieldDesc={s.setFieldDesc}
              fieldRequired={s.fieldRequired}
              setFieldRequired={s.setFieldRequired}
              isPending={s.isPending}
              handleCreateCustomField={s.handleCreateCustomField}
              handleDeleteCustomField={s.handleDeleteCustomField}
            />
          )}

          {s.activeSubTab === 'display' && (
            <SettingsDisplayTab
              desktopNotifications={s.desktopNotifications}
              handleToggleDesktopNotifications={s.handleToggleDesktopNotifications}
              handleSendTestNotification={s.handleSendTestNotification}
              testNotificationSent={s.testNotificationSent}
              compactCards={s.compactCards}
              handleToggleCompactCards={s.handleToggleCompactCards}
              defaultPriority={s.defaultPriority}
              handleDefaultPriorityChange={s.handleDefaultPriorityChange}
              prioritySavedFeedback={s.prioritySavedFeedback}
              isSundayStart={s.isSundayStart}
              handleWeekStartChange={s.handleWeekStartChange}
              weekStartSavedFeedback={s.weekStartSavedFeedback}
              timeFormat={s.timeFormat}
              handleTimeFormatChange={s.handleTimeFormatChange}
              timeFormatSavedFeedback={s.timeFormatSavedFeedback}
            />
          )}

          {s.activeSubTab === 'system' && (
            <SettingsSystemTab
              backendUrlInput={s.backendUrlInput}
              setBackendUrlInput={s.setBackendUrlInput}
              testingConnection={s.testingConnection}
              handleTestBackendConnection={s.handleTestBackendConnection}
              handleSaveBackendUrl={s.handleSaveBackendUrl}
              handleResetBackendUrl={s.handleResetBackendUrl}
              backendSaveFeedback={s.backendSaveFeedback}
              testResult={s.testResult}
              health={s.health}
              healthLoading={s.healthLoading}
            />
          )}

          {s.activeSubTab === 'git' && (
            <GitPluginSettingTab projects={s.projects} />
          )}
        </div>
      </div>

      <ActionFeedbackModal state={s.errorState} onClose={s.closeErrorModal} />

      {showCropModal && (
        <AvatarCropModal
          isOpen={showCropModal}
          imageSrc={s.cropTarget?.src || null}
          fileName={s.cropTarget?.fileName || ''}
          onClose={() => setShowCropModal(false)}
          onCropComplete={(croppedPngDataUrl) => {
            s.setAvatar(croppedPngDataUrl);
            setShowCropModal(false);
          }}
        />
      )}
    </div>
  );
};