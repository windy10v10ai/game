import React from 'react';
import { useNetTable } from '../../../shared/hooks/useNetTable';

interface OfflineHintProps {
  visible: boolean;
}

/** 离线模式下的只读提示，标出离线数据的截至日期。 */
export function OfflineHint({ visible }: OfflineHintProps) {
  const loading = useNetTable('loading_status', 'loading_status');
  const text = $.Localize('#offline_data_hint').replace('{date}', loading?.snapshotDate || '-');

  return (
    <Panel
      className="profile-offline-hint"
      style={{ visibility: visible ? 'visible' : 'collapse' }}
    >
      <Panel className="profile-offline-hint-dot" />
      <Label className="profile-offline-hint-label" text={text} />
    </Panel>
  );
}
