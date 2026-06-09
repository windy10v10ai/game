import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React, { useEffect, useRef, useState } from 'react';
import { AddKeyBind, FindDotaHudElement } from '@utils/utils';

const POLL_INTERVAL_MS = 200;

const SLOTS = [
  {
    ability: 'ability_ward_observer_slot',
    item: 'item_ward_observer',
    keybind: DOTAKeybindCommand_t.DOTA_KEYBIND_CONTROL_GROUP5,
  },
  {
    ability: 'ability_ward_sentry_slot',
    item: 'item_ward_sentry',
    keybind: DOTAKeybindCommand_t.DOTA_KEYBIND_CONTROL_GROUP6,
  },
] as const;

const containerStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'right',
  verticalAlign: 'bottom',
  marginRight: '72px',
  marginBottom: '14px',
  flowChildren: 'down',
};

const slotStyle: Partial<VCSSStyleDeclaration> = {
  width: '55px',
  height: '50px',
  marginTop: '2px',
  backgroundColor: '#0B0D10ee',
  border: '1px solid #393939',
  borderRadius: '3px',
  boxShadow: 'inset #000000cc 0px 0px 8px 0px',
};

const iconBaseStyle: Partial<VCSSStyleDeclaration> = {
  width: '45px',
  height: '45px',
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
  borderRadius: '50%',
  border: '1px solid #393939',
  boxShadow: 'inset #000000aa 0px 0px 6px 0px',
};

const chargeStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'right',
  verticalAlign: 'bottom',
  marginRight: '2px',
  fontSize: '18px',
  color: '#FFFFFF',
  fontWeight: 'bold',
  textShadow: '0px 0px 5px 3.0 #8B0000FF',
};

const hotkeyStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'left',
  verticalAlign: 'top',
  minWidth: '14px',
  height: '14px',
  backgroundColor: '#000000cc',
  border: '1px solid #000000',
  borderRadius: '2px',
  color: '#FFFFFF',
  fontSize: '10px',
  fontWeight: 'bold',
  textAlign: 'center',
  textShadow: '1px 1px 2px 2.0 #000000FF',
  zIndex: 1,
};

interface SlotState {
  charges: number;
  hotkey: string;
}

function getHeroSlotAbility(abilityName: string): AbilityEntityIndex | -1 {
  const heroId = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
  if (heroId === -1) {
    return -1;
  }
  return Entities.GetAbilityByName(heroId, abilityName);
}

function placeWard(abilityName: string) {
  const heroId = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
  if (heroId === -1) {
    return;
  }
  const abilityId = Entities.GetAbilityByName(heroId, abilityName);
  if (abilityId === -1 || Abilities.GetCurrentAbilityCharges(abilityId) <= 0) {
    return;
  }
  Abilities.ExecuteAbility(abilityId, heroId, true);
}

function WardSlot() {
  const containerRef = useRef<Panel | null>(null);
  const [states, setStates] = useState<SlotState[]>(() =>
    SLOTS.map(({ keybind }) => ({ charges: 0, hotkey: Game.GetKeybindForCommand(keybind) })),
  );

  useEffect(() => {
    const centerWithStats = FindDotaHudElement('center_with_stats');
    if (centerWithStats && containerRef.current) {
      containerRef.current.SetParent(centerWithStats);
    }
  }, []);

  useEffect(() => {
    for (const { ability, keybind } of SLOTS) {
      const keyName = Game.GetKeybindForCommand(keybind);
      if (keyName !== '') {
        AddKeyBind(
          keyName,
          () => placeWard(ability),
          () => {},
        );
      }
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStates(
        SLOTS.map(({ ability, keybind }) => {
          const abilityId = getHeroSlotAbility(ability);
          return {
            charges: abilityId === -1 ? 0 : Abilities.GetCurrentAbilityCharges(abilityId),
            hotkey: Game.GetKeybindForCommand(keybind),
          };
        }),
      );
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel hittest={false} ref={containerRef} style={containerStyle}>
      {SLOTS.map(({ ability, item }, i) => {
        const charges = states[i].charges;
        return (
          <Panel
            key={ability}
            hittest={true}
            style={slotStyle}
            onactivate={() => placeWard(ability)}
          >
            <DOTAItemImage
              itemname={item}
              showtooltip={true}
              style={{ ...iconBaseStyle, opacity: charges > 0 ? '1' : '0.32' }}
            />
            {states[i].hotkey !== '' && <Label style={hotkeyStyle} text={states[i].hotkey} />}
            <Label style={chargeStyle} text={charges.toString()} />
          </Panel>
        );
      })}
    </Panel>
  );
}

export default WardSlot;
