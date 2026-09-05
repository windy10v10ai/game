import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import Lottery from './Lottery';
import KeyBind from './KeyBind';
import ItemLottery from './ItemLottery';
import PassiveTomeLottery from './PassiveTomeLottery';
import WardSlot from './WardSlot';
import { setAbilityKeyUnitOverride } from './hotkey';

GameEvents.Subscribe('death_prophet_possession_select', ({ entindex, active }) => {
  setAbilityKeyUnitOverride(active === 1 ? entindex : undefined);
});

function Root() {
  return (
    <Panel style={{ width: '100%', height: '100%' }} hittest={false}>
      <ItemLottery />
      <PassiveTomeLottery />
      <Lottery />
      <KeyBind />
      <WardSlot />
    </Panel>
  );
}

render(<Root />, $.GetContextPanel());
