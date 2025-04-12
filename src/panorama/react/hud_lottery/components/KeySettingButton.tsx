import React, { useEffect, useState } from 'react';
import { bindAbilityKey } from '../hotkey';

interface KeySettingButtonProps {
  abilityname?: string;
  bindKeyText: string;
  setBindKeyText: React.Dispatch<React.SetStateAction<string>>;
  quickCast: boolean;
  setQuickCast: React.Dispatch<React.SetStateAction<boolean>>;
}

const rootPanelStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'down',
  padding: '10px', // 内边距
  width: '100px', // 宽度
  borderRadius: '3px', // 圆角
};

const KeySettingButton = ({
  abilityname,
  bindKeyText,
  setBindKeyText,
  quickCast,
  setQuickCast,
}: KeySettingButtonProps): React.ReactElement => {
  const [isActive, setIsActive] = useState(false);
  // 移除A,S
  const validKeys = " BCDEFGHIJKLMNOPQRTUVWXYZ0123456789`-=[]\\;',./";

  const activeKeySetting = (e: Panel) => {
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
    if (validKeys.indexOf(key) === -1) {
      textEntry.text = '';
      $.DispatchEvent('DOTAShowTextTooltip', textEntry, $.Localize('#key_bind_input_err'));
      $.Schedule(2, () => {
        $.DispatchEvent('DOTAHideTextTooltip');
      });
    } else {
      setBindKeyText(key);
      setIsActive(false);
    }
  };

  const onQuickCastChange = () => {
    const quickCastChanged = !quickCast;
    setQuickCast(quickCastChanged);
  };

  useEffect(() => {
    // 当ability和bindKeyText都存在时，设置快捷键
    if (abilityname === undefined) {
      return;
    }
    if (bindKeyText === '') {
      return;
    }
    bindAbilityKey(abilityname, bindKeyText, quickCast);
  }, [abilityname, bindKeyText, quickCast]);

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
