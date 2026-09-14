import { useEffect } from 'react';
import { FindDotaHudElement, WEBSITE_URL } from '@utils/utils';

const WEBSITE_BUTTON_ID = 'websiteButton';

/** 按钮栏里的网站入口，点击用外部浏览器打开网站首页 */
export function WebsiteEntryButton() {
  useEffect(() => {
    let buttonBar: Panel | null = null;
    try {
      buttonBar = FindDotaHudElement('ButtonBar');
    } catch (e) {
      $.Msg('[WebsiteEntryButton] cannot locate ButtonBar: ', e);
    }
    if (!buttonBar) {
      return () => {
        /* noop */
      };
    }

    const existing = buttonBar.FindChild(WEBSITE_BUTTON_ID);
    const button = existing ?? $.CreatePanel('Button', buttonBar, WEBSITE_BUTTON_ID);

    button.style.width = '42px';
    button.style.height = '42px';
    button.style.verticalAlign = 'center';
    // 按钮栏子按钮默认半透明，图标偏暗时不易辨认
    button.style.opacity = '0.8';
    button.style.marginLeft = '2px';
    button.style.marginRight = '2px';
    button.style.backgroundImage = "url('file://{images}/custom_game/website/icon_website.png')";
    button.style.backgroundSize = '100% 100%';
    button.style.backgroundRepeat = 'no-repeat';
    button.style.transitionProperty = 'brightness';
    button.style.transitionDuration = '0.1s';

    // 其他入口按钮可能由别的 hud 层先行创建，统一把网站入口排到按钮栏末尾
    const children = buttonBar.Children();
    const last = children[children.length - 1];
    if (last && last !== button) {
      buttonBar.MoveChildAfter(button, last);
    }

    button.SetPanelEvent('onactivate', () => {
      $.DispatchEvent('ExternalBrowserGoToURL', WEBSITE_URL);
    });

    // 按钮挂在 Dota HUD 下，自定义样式表的 :hover 作用不到，改用鼠标事件高亮
    button.SetPanelEvent('onmouseover', () => {
      button.style.brightness = '1.3';
      $.DispatchEvent('DOTAShowTextTooltip', button, $.Localize('#website_open_button'));
    });

    button.SetPanelEvent('onmouseout', () => {
      button.style.brightness = '1';
      $.DispatchEvent('DOTAHideTextTooltip');
    });

    return () => {
      button.ClearPanelEvent('onactivate');
      button.ClearPanelEvent('onmouseover');
      button.ClearPanelEvent('onmouseout');
      button.DeleteAsync(0);
    };
  }, []);

  return null;
}
