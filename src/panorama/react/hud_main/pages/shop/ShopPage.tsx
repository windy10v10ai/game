import React from 'react';
import { useNavigation } from '../../store/NavigationContext';

/**
 * 商店页面占位组件。后续实现会消费 shared/components 的 Modal/AppButton。
 */
export function ShopPage() {
  const { closePage } = useNavigation();

  return (
    <Panel className="modal-backdrop">
      <Panel className="modal-panel">
        <Panel className="modal-header">
          <Label className="modal-title" text="商店" />
          <Button className="btn-close" onactivate={closePage} />
        </Panel>
        <Panel className="content-area">
          <Label text="商店功能开发中..." style={{ color: '#fdcffa', fontSize: '20px' }} />
        </Panel>
      </Panel>
    </Panel>
  );
}
