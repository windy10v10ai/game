import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React from 'react';
import { render } from 'react-panorama-x';
import HudMain from './HudMain';

render(<HudMain />, $.GetContextPanel());
