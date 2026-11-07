import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React from 'react';
import { useNetTable } from '../shared/hooks/useNetTable';

const containerStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
  marginBottom: '250px',
  flowChildren: 'down',
};

const titleStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  marginTop: '8px',
  marginLeft: '12px',
  marginRight: '12px',
  fontSize: '20px',
  color: 'gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), color-stop(0.6, #FFE982), to(#CA8E25))',
  fontWeight: 'bold',
  textShadow: '1px 1px 8px 3.0 #000000FF',
};

const rowStyle: Partial<VCSSStyleDeclaration> = {
  marginTop: '8px',
  marginLeft: '10px',
  marginRight: '10px',
  flowChildren: 'right',
  horizontalAlign: 'center',
  verticalAlign: 'center',
};

const abilityStyle: Partial<VCSSStyleDeclaration> = {
  width: '80px',
  margin: '2px 10px',
};

const cancelButtonStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  marginTop: '4px',
  marginBottom: '8px',
  backgroundColor: '#000000aa',
  borderRadius: '4px',
  border: '1px solid #ffd70088',
};

const cancelLabelStyle: Partial<VCSSStyleDeclaration> = {
  fontSize: '16px',
  color: '#FFFFFF',
  marginLeft: '16px',
  marginRight: '16px',
  marginTop: '4px',
  marginBottom: '4px',
};

function forgetAbility(name: string) {
  GameEvents.SendCustomGameEventToServer('lottery_forget_passive_tome', { name });
}

function cancelForget() {
  GameEvents.SendCustomGameEventToServer('lottery_cancel_forget_passive_tome', {});
}

/** 遗忘技能书的选择窗口：列出被动技能书得到的额外被动，点一个遗忘，取消不消耗书 */
function PassiveTomeForget() {
  const playerId = Game.GetLocalPlayerID().toString();
  const raw = useNetTable('lottery_passive_tome', playerId);

  // TSTL array 经 net 同步为 object，转回数组
  const owned: string[] = raw?.owned ? (Object.values(raw.owned) as string[]) : [];
  // 引擎把 boolean 同步为 0/1
  const isOpen = Boolean(raw?.forgetting) && owned.length > 0;

  return (
    <Panel
      className="passive-tome-forget-container"
      style={{ ...containerStyle, visibility: isOpen ? 'visible' : 'collapse' }}
      hittest={true}
    >
      <Label style={titleStyle} text={$.Localize('#lottery_forget_passive_tome_header')} />
      <Panel style={rowStyle}>
        {owned.map((name, i) => (
          <DOTAAbilityImage
            key={`passive-tome-forget-${i}-${name}`}
            abilityname={name}
            showtooltip={true}
            onactivate={() => forgetAbility(name)}
            className="BrightHover"
            style={abilityStyle}
          />
        ))}
      </Panel>
      <Button className="BrightHover" style={cancelButtonStyle} onactivate={cancelForget}>
        <Label style={cancelLabelStyle} text={$.Localize('#lottery_forget_passive_tome_cancel')} />
      </Button>
    </Panel>
  );
}

export default PassiveTomeForget;
