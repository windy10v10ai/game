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
  width: '48px',
  height: '36px',
  marginTop: '2px',
};

const chargeStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'right',
  verticalAlign: 'bottom',
  marginRight: '2px',
  fontSize: '16px',
  color: '#FFFFFF',
  fontWeight: 'bold',
  textShadow: '1px 1px 4px 2.0 #000000FF',
};

const hotkeyStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'left',
  verticalAlign: 'top',
  width: '14px',
  height: '14px',
  backgroundColor: '#000000cc',
  color: '#FFFFFF',
  fontSize: '11px',
  fontWeight: 'bold',
  textAlign: 'center',
  textShadow: '1px 1px 2px 2.0 #000000FF',
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
  Abilities.ExecuteAbility(abilityId, heroId, false);
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

  const hasAny = states.some((s) => s.charges > 0);

  return (
    <Panel
      ref={containerRef}
      style={{ ...containerStyle, visibility: hasAny ? 'visible' : 'collapse' }}
      hittest={false}
    >
      {SLOTS.map(({ ability, item }, i) => (
        <Panel
          key={ability}
          style={{ ...slotStyle, visibility: states[i].charges > 0 ? 'visible' : 'collapse' }}
          hittest={true}
        >
          <DOTAItemImage
            itemname={item}
            showtooltip={true}
            onactivate={() => placeWard(ability)}
            className="BrightHover"
            style={{ width: '100%', height: '100%' }}
          />
          {states[i].hotkey !== '' && <Label style={hotkeyStyle} text={states[i].hotkey} />}
          <Label style={chargeStyle} text={states[i].charges.toString()} />
        </Panel>
      ))}
    </Panel>
  );
}

export default WardSlot;
