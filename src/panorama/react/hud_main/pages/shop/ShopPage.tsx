import React from 'react';
import { useNavigation } from '../../store/NavigationContext';

/**
 * 商店页面占位组件。
 */
export function ShopPage() {
  const { closePage } = useNavigation();

  return (
    <Panel className="modal-panel" hittest={true}>
      <Panel className="modal-header">
        <Label className="modal-title" text="商店" />
        <Button className="btn-close" onactivate={closePage} />
      </Panel>
      <Panel className="content-area">
        <Label text="商店功能开发中..." style={{ color: '#fdcffa', fontSize: '20px' }} />
      </Panel>
    </Panel>
  );
}
