import React, { useState } from 'react';
import { bindAbilityKey } from '../hotkey';

interface KeySettingButtonProps {
  abilityname?: string;
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
  const [quickCast, setQuickCast] = useState(false);
  // 移除A,S
  const validKeys = "BCDEFGHIJKLMNOPQRTUVWXYZ0123456789`-=[]\\;',./";

  const activeKeySetting = (e: Panel) => {
    if (abilityname === undefined) {
      return;
    }
    $.DispatchEvent('DOTAHideTextTooltip');
    if (isActive) {
      return;
    }
    setIsActive(true);

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
    if (abilityname === undefined) {
      return;
    }
    if (validKeys.indexOf(key) === -1) {
      textEntry.text = '';
      $.DispatchEvent('DOTAShowTextTooltip', textEntry, $.Localize('#key_bind_input_err'));
      $.Schedule(2, () => {
        $.DispatchEvent('DOTAHideTextTooltip');
      });
    } else {
      setBindKeyText(key);
      setIsActive(false);
      bindAbilityKey(abilityname, key, quickCast);
    }
  };

  const onQuickCastChange = () => {
    const quickCastChanged = !quickCast;
    setQuickCast(quickCastChanged);
    if (abilityname === undefined) {
      return;
    }
    if (bindKeyText === '') {
      return;
    }
    bindAbilityKey(abilityname, bindKeyText, quickCastChanged);
  };

  return (
    <Panel style={rootPanelStyle} className="BindingRow">
      <DOTAAbilityImage abilityname={abilityname} showtooltip={true} />
      <Panel
        className="BindingContainer"
        onmouseactivate={activeKeySetting}
        // on mouse over, show the tooltip
        onmouseover={(e) => {
          if (abilityname === undefined) {
            return;
          }
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
      <Panel
        style={{
          flowChildren: 'right',
          width: '100%',
          marginTop: '2px',
        }}
        onactivate={onQuickCastChange}
      >
        <ToggleButton style={{ verticalAlign: 'center' }} selected={quickCast} />
        <Label
          style={{ fontSize: '12px', verticalAlign: 'center' }}
          text={$.Localize('#key_bind_quick_cast')}
        />
      </Panel>
    </Panel>
  );
};

export default KeySettingButton;
