import React, { useEffect, useState } from 'react';
import { bindInventorySlotKey } from '../hotkey';
import KeyCaptureBox from './KeyCaptureBox';

interface InventorySlotKeySettingButtonProps {
  inventorySlot: number;
  displaySlot: number;
  bindKeyText: string;
  setBindKeyText: (key: string) => void;
  quickCast: boolean;
  setQuickCast: (value: boolean) => void;
}

interface SlotItemState {
  itemName: string;
  isActivated: boolean;
}

const POLL_INTERVAL_MS = 250;

const rootPanelStyle: Partial<VCSSStyleDeclaration> = {
  width: '100px',
  height: '36px',
  padding: '4px 0px 4px 4px',
  borderRadius: '3px',
};

const iconStyle: Partial<VCSSStyleDeclaration> = {
  width: '28px',
  height: '28px',
  horizontalAlign: 'left',
  verticalAlign: 'center',
};

const emptySlotStyle: Partial<VCSSStyleDeclaration> = {
  width: '28px',
  height: '28px',
  horizontalAlign: 'left',
  verticalAlign: 'center',
  backgroundColor: '#252929',
  border: '1px solid #4a4f50',
  color: '#aeb4b5',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center',
  paddingTop: '4px',
};

const slotBadgeStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'left',
  verticalAlign: 'top',
  minWidth: '12px',
  height: '12px',
  backgroundColor: '#000000dd',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: 'bold',
  textAlign: 'center',
  zIndex: 2,
};

const captureBoxStyle: Partial<VCSSStyleDeclaration> = {
  width: '34px',
  height: '28px',
  marginTop: '0px',
  marginLeft: '32px',
  horizontalAlign: 'left',
  verticalAlign: 'center',
};

const captureTextStyle: Partial<VCSSStyleDeclaration> = {
  fontSize: '17px',
  height: '28px',
  padding: '2px 0px 0px 0px',
};

const quickCastToggleStyle: Partial<VCSSStyleDeclaration> = {
  width: '28px',
  height: '28px',
  horizontalAlign: 'right',
  verticalAlign: 'center',
};

function readSlotItem(inventorySlot: number): SlotItemState {
  const heroID = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
  if (heroID === -1) {
    return { itemName: '', isActivated: false };
  }

  const itemID = Entities.GetItemInSlot(heroID, inventorySlot) as AbilityEntityIndex;
  if (itemID === -1 || !Abilities.IsItem(itemID)) {
    return { itemName: '', isActivated: false };
  }

  return {
    itemName: Abilities.GetAbilityName(itemID),
    isActivated: Abilities.IsActivated(itemID),
  };
}

const InventorySlotKeySettingButton = ({
  inventorySlot,
  displaySlot,
  bindKeyText,
  setBindKeyText,
  quickCast,
  setQuickCast,
}: InventorySlotKeySettingButtonProps): React.ReactElement => {
  const [slotItem, setSlotItem] = useState<SlotItemState>(() => readSlotItem(inventorySlot));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = readSlotItem(inventorySlot);
      setSlotItem((current) =>
        current.itemName === next.itemName && current.isActivated === next.isActivated
          ? current
          : next,
      );
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [inventorySlot]);

  useEffect(() => {
    if (bindKeyText === '') {
      return;
    }
    bindInventorySlotKey(inventorySlot, bindKeyText, quickCast);
  }, [inventorySlot, bindKeyText, quickCast]);

  const tooltip = $.Localize('#key_bind_inventory_slot_tooltip').replace(
    '%s',
    displaySlot.toString(),
  );
  const hasItem = slotItem.itemName !== '';

  return (
    <Panel style={rootPanelStyle} className="BindingRow">
      {hasItem ? (
        <DOTAItemImage
          itemname={slotItem.itemName}
          showtooltip
          style={{ ...iconStyle, opacity: slotItem.isActivated ? '1' : '0.4' }}
        />
      ) : (
        <Label text={displaySlot.toString()} style={emptySlotStyle} />
      )}
      <Label
        text={displaySlot.toString()}
        style={slotBadgeStyle}
        onmouseover={(panel) => $.DispatchEvent('DOTAShowTextTooltip', panel, tooltip)}
        onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
      />
      <KeyCaptureBox
        bindKeyText={bindKeyText}
        setBindKeyText={setBindKeyText}
        style={captureBoxStyle}
        textStyle={captureTextStyle}
      />
      <Panel
        style={quickCastToggleStyle}
        onactivate={() => setQuickCast(!quickCast)}
        onmouseover={(panel) =>
          $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize('#key_bind_quick_cast'))
        }
        onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
      >
        <ToggleButton
          style={{
            width: '26px',
            height: '26px',
            horizontalAlign: 'center',
            verticalAlign: 'center',
          }}
          selected={quickCast}
        />
      </Panel>
    </Panel>
  );
};

export default InventorySlotKeySettingButton;
