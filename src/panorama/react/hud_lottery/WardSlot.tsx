import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React, { useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 200;

const SLOTS = [
  { ability: 'ability_ward_observer_slot', item: 'item_ward_observer' },
  { ability: 'ability_ward_sentry_slot', item: 'item_ward_sentry' },
] as const;

const containerStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
  marginBottom: '120px',
  flowChildren: 'right',
};

const slotStyle: Partial<VCSSStyleDeclaration> = {
  width: '48px',
  height: '36px',
  margin: '0px 3px',
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

interface SlotState {
  charges: number;
}

function WardSlot() {
  const [states, setStates] = useState<SlotState[]>(() => SLOTS.map(() => ({ charges: 0 })));

  useEffect(() => {
    const id = setInterval(() => {
      const heroId = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
      if (heroId === -1) {
        return;
      }
      setStates(
        SLOTS.map(({ ability }) => {
          const abilityId = Entities.GetAbilityByName(heroId, ability);
          if (abilityId === -1) {
            return { charges: 0 };
          }
          return { charges: Abilities.GetCurrentAbilityCharges(abilityId) };
        }),
      );
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const placeWard = (abilityName: string) => {
    const heroId = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
    const abilityId = Entities.GetAbilityByName(heroId, abilityName);
    if (abilityId === -1) {
      return;
    }
    Abilities.ExecuteAbility(abilityId, heroId, false);
  };

  const hasAny = states.some((s) => s.charges > 0);

  return (
    <Panel
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
          <Label style={chargeStyle} text={states[i].charges.toString()} />
        </Panel>
      ))}
    </Panel>
  );
}

export default WardSlot;
