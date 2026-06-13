import React, { useEffect } from 'react';
import { bindAbilityKey } from '../hotkey';
import KeyCaptureBox from './KeyCaptureBox';

interface WardKeySettingButtonProps {
  itemname: string;
  abilityname: string;
  bindKeyText: string;
  setBindKeyText: (key: string) => void;
  quickCast: boolean;
  setQuickCast: (value: boolean) => void;
}

const rootPanelStyle: Partial<VCSSStyleDeclaration> = {
  width: '150px',
  height: '32px',
  padding: '4px 6px',
  borderRadius: '3px',
};

const iconStyle: Partial<VCSSStyleDeclaration> = {
  width: '28px',
  height: '28px',
  horizontalAlign: 'left',
  verticalAlign: 'center',
};

const captureBoxStyle: Partial<VCSSStyleDeclaration> = {
  width: '70px',
  height: '28px',
  marginTop: '0px',
  marginLeft: '32px',
  horizontalAlign: 'left',
  verticalAlign: 'center',
};

const captureTextStyle: Partial<VCSSStyleDeclaration> = {
  fontSize: '20px',
  height: '28px',
  padding: '0px',
};

const quickCastToggleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'right',
  verticalAlign: 'center',
};

/**
 * 真假眼额外槛位的改键设置，单行紧凑布局：图标 + 按键框 + 快速施法开关。
 * ability_ward_observer_slot / ability_ward_sentry_slot 为 POINT 目标技能，
 * bindAbilityKey 的 QuickCastAbility 已原生支持光标位置快速施法。
 */
const WardKeySettingButton = ({
  itemname,
  abilityname,
  bindKeyText,
  setBindKeyText,
  quickCast,
  setQuickCast,
}: WardKeySettingButtonProps): React.ReactElement => {
  useEffect(() => {
    if (bindKeyText === '') {
      return;
    }
    bindAbilityKey(abilityname, bindKeyText, quickCast);
  }, [abilityname, bindKeyText, quickCast]);

  return (
    <Panel style={rootPanelStyle} className="BindingRow">
      <DOTAItemImage itemname={itemname} showtooltip={true} style={iconStyle} />
      <KeyCaptureBox
        bindKeyText={bindKeyText}
        setBindKeyText={setBindKeyText}
        style={captureBoxStyle}
        textStyle={captureTextStyle}
      />
      <Panel
        style={quickCastToggleStyle}
        onactivate={() => setQuickCast(!quickCast)}
        onmouseover={(e) =>
          $.DispatchEvent('DOTAShowTextTooltip', e, $.Localize('#key_bind_quick_cast'))
        }
        onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
      >
        <ToggleButton selected={quickCast} />
      </Panel>
    </Panel>
  );
};

export default WardKeySettingButton;
