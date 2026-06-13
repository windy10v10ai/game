import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React, { useEffect, useRef, useState } from 'react';
import { FindDotaHudElement, GetLocalPlayerSteamAccountID } from '@utils/utils';
import { useNetTable } from '../shared/hooks/useNetTable';
import { PlayerSetting } from '../../../vscripts/api/player';

const POLL_INTERVAL_MS = 200;
const RIGHT_FLARE_WIDTH = '125px';
const RIGHT_FLARE_MARGIN_RIGHT = '-25px';
const RIGHT_FLARE_BACKGROUND_IMAGE = "url('file://{images}/custom_game/hud/right_flare_bg.png')";
const INVENTORY_COMPOSITION_MARGIN_RIGHT = '27px';
const INVENTORY_MARGIN_RIGHT = '100px';
const ABILITY_INSET_SHADOW_RIGHT_MARGIN_RIGHT = '302px';

const SLOTS = [
  {
    ability: 'ability_ward_observer_slot',
    item: 'item_ward_observer',
    settingKey: 'wardObserverKey',
  },
  {
    ability: 'ability_ward_sentry_slot',
    item: 'item_ward_sentry',
    settingKey: 'wardSentryKey',
  },
] as const satisfies readonly { ability: string; item: string; settingKey: keyof PlayerSetting }[];

const containerStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'right',
  verticalAlign: 'bottom',
  flowChildren: 'down',
  marginBottom: '8px',
  transform: 'translateX(-55px)',
};

const slotStyle: Partial<VCSSStyleDeclaration> = {
  width: '52px',
  height: '48px',
};

const iconBaseStyle: Partial<VCSSStyleDeclaration> = {
  width: '42px',
  height: '42px',
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
  const [charges, setCharges] = useState<number[]>(() => SLOTS.map(() => 0));
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const player = useNetTable('player_table', steamAccountId);
  const playerSetting = player?.playerSetting;

  useEffect(() => {
    const centerWithStats = FindDotaHudElement('center_with_stats');
    if (centerWithStats && containerRef.current) {
      containerRef.current.SetParent(centerWithStats);
    }

    const rightFlare = FindDotaHudElement('right_flare');
    if (rightFlare) {
      rightFlare.style.width = RIGHT_FLARE_WIDTH;
      rightFlare.style.marginRight = RIGHT_FLARE_MARGIN_RIGHT;
      rightFlare.style.backgroundImage = RIGHT_FLARE_BACKGROUND_IMAGE;
    }

    const inventoryComposition = FindDotaHudElement('inventory_composition_layer_container');
    if (inventoryComposition) {
      inventoryComposition.style.marginRight = INVENTORY_COMPOSITION_MARGIN_RIGHT;
    }

    const inventory = FindDotaHudElement('inventory');
    if (inventory) {
      inventory.style.marginRight = INVENTORY_MARGIN_RIGHT;
    }

    const centerBlock = FindDotaHudElement('center_block');
    const abilityInsetShadowRight = centerBlock?.FindChildTraverse('AbilityInsetShadowRight');
    if (abilityInsetShadowRight) {
      abilityInsetShadowRight.style.marginRight = ABILITY_INSET_SHADOW_RIGHT_MARGIN_RIGHT;
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCharges(
        SLOTS.map(({ ability }) => {
          const abilityId = getHeroSlotAbility(ability);
          return abilityId === -1 ? 0 : Abilities.GetCurrentAbilityCharges(abilityId);
        }),
      );
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel hittest={false} ref={containerRef} style={containerStyle}>
      {SLOTS.map(({ ability, item, settingKey }, i) => {
        const chargeCount = charges[i];
        const hotkey = playerSetting?.[settingKey] ?? '';
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
              style={{ ...iconBaseStyle, opacity: chargeCount > 0 ? '1' : '0.4' }}
            />
            {hotkey !== '' && <Label style={hotkeyStyle} text={hotkey} />}
            <Label style={chargeStyle} text={chargeCount.toString()} />
          </Panel>
        );
      })}
    </Panel>
  );
}

export default WardSlot;
