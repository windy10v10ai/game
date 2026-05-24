import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';

import { render } from 'react-panorama-x';
import Lottery from './Lottery';
import KeyBind from './KeyBind';
import ItemLottery from './ItemLottery';

function Root() {
  return (
    <Panel style={{ width: '100%', height: '100%' }} hittest={false}>
      <Lottery />
      <KeyBind />
      <ItemLottery />
    </Panel>
  );
}

render(<Root />, $.GetContextPanel());
