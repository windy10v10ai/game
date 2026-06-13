import React, { useEffect } from 'react';
import { bindAbilityKey } from '../hotkey';
import KeyCaptureBox from './KeyCaptureBox';

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
      <KeyCaptureBox bindKeyText={bindKeyText} setBindKeyText={setBindKeyText} />
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
