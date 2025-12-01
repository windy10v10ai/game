import React, { useState } from 'react';

/**
 * 设置页面组件
 */
export function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    // TODO: 发送事件到服务器保存设置
    // GameEvents.SendCustomGameEventToServer('home_setting_changed', {
    //   setting: 'sound',
    //   value: !soundEnabled
    // });
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // TODO: 发送事件到服务器保存设置
  };

  return (
    <Panel className="settings-container">
      <Label className="section-title" text="游戏设置" />

      <Panel className="setting-item">
        <Label className="setting-label" text="音效：" />
        <Button className="setting-button" onactivate={handleSoundToggle}>
          <Label text={soundEnabled ? '开启' : '关闭'} />
        </Button>
      </Panel>

      <Panel className="setting-item">
        <Label className="setting-label" text="通知：" />
        <Button className="setting-button" onactivate={handleNotificationsToggle}>
          <Label text={notificationsEnabled ? '开启' : '关闭'} />
        </Button>
      </Panel>

      <Label className="section-title" text="关于" />

      <Panel className="setting-item">
        <Label className="setting-label" text="版本：" />
        <Label className="setting-value" text="v4.00" />
      </Panel>
    </Panel>
  );
}
