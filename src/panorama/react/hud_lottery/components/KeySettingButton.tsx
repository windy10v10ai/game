import React, { useState } from 'react';

interface KeySettingButtonProps {
  abilityname?: string;
  // bindKeyText: string;
}

const rootPanelStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'down',
  padding: '10px', // 内边距
  width: '100px', // 宽度
  borderRadius: '3px', // 圆角
};

const KeySettingButton: React.FC<KeySettingButtonProps> = ({ abilityname }) => {
  const [isActive, setIsActive] = useState(false);
  const [bindKeyText, setBindKeyText] = useState('');
  const validKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const activeKeySetting = (e: Panel) => {
    $.DispatchEvent('DOTAHideTextTooltip');
    if (isActive) {
      return;
    }
    setIsActive(true);

    // focus on the text entry
    const textEntry = e.FindChildTraverse('keyBindTextEntry') as TextEntry | null;
    if (textEntry) {
      textEntry.text = '';
      textEntry.SetFocus();
    }
  };

  const onTextEntryChange = (textEntry: TextEntry) => {
    const key = textEntry.text.toUpperCase();
    if (key === '') {
      return;
    }
    if (validKeys.indexOf(key) === -1) {
      $.Msg('Invalid key: ', key);
      textEntry.text = '';
    } else {
      setBindKeyText(key);
      setIsActive(false);
      if (abilityname) {
        // TODO 设置技能快捷键
      }
    }
  };

  return (
    <Panel style={rootPanelStyle} className="BindingRow">
      <DOTAAbilityImage abilityname={abilityname} showtooltip={true} />
      <Panel
        className="BindingContainer"
        onmouseactivate={activeKeySetting}
        // on mouse over, show the tooltip
        onmouseover={(e) => {
          if (isActive) {
            return;
          }
          $.DispatchEvent('DOTAShowTextTooltip', e, $.Localize('#key_bind_mouseover_tooltop'));
        }}
        // on mouse out, hide the tooltip
        onmouseout={() => {
          $.DispatchEvent('DOTAHideTextTooltip');
        }}
      >
        <Label
          style={{ visibility: isActive ? 'collapse' : 'visible' }}
          className="BindingText"
          text={bindKeyText}
        />
        <TextEntry
          id="keyBindTextEntry"
          style={{ visibility: isActive ? 'visible' : 'collapse' }}
          className={`TextEntryArea ${isActive ? 'Actived' : ''}`}
          placeholder={$.Localize('#key_bind_placeholder')}
          maxchars={1}
          ontextentrychange={onTextEntryChange}
        />
      </Panel>
    </Panel>
  );
};

export default KeySettingButton;
