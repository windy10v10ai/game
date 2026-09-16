import React from 'react';

const ADDON_WORKSHOP_ID = 2307479570;
const COMMAND_ENTRY_ID = 'profileConsoleCommand';

interface OfflineHintProps {
  visible: boolean;
}

/** 服务端数据不可达时的降级提示，附带下一局可用的控制台启动命令。 */
export function OfflineHint({ visible }: OfflineHintProps) {
  // 地图名同时是 dota_launch_custom_game 的难度参数，玩家看到的始终是本局这一条
  // map_name 形如 maps/dota.vpk，命令参数要的是去掉路径与后缀的地图名
  const mapName = Game.GetMapInfo().map_name.split('/').pop()?.split('.')[0] ?? '';
  const command = `dota_launch_custom_game ${ADDON_WORKSHOP_ID} ${mapName}`;

  // Panorama 没有剪贴板接口，只能把命令选中后交给玩家自己按 Ctrl+C
  const selectCommand = (button: Panel) => {
    const entry = button.GetParent()?.FindChildTraverse(COMMAND_ENTRY_ID) as TextEntry | null;
    if (!entry) {
      return;
    }
    entry.SetFocus();
    entry.SelectAll();
  };

  // TextEntry 是可编辑的，改动后立刻还原，避免玩家复制到残缺命令
  const restoreCommand = (entry: TextEntry) => {
    if (entry.text !== command) {
      entry.text = command;
    }
  };

  return (
    <Panel
      className="profile-offline-hint"
      style={{ visibility: visible ? 'visible' : 'collapse' }}
    >
      <Label className="profile-offline-hint-label" text={$.Localize('#offline_data_hint')} />
      <Panel className="profile-offline-hint-row">
        <Label
          className="profile-offline-hint-lead"
          text={$.Localize('#console_launch_ingame_hint')}
        />
        <TextEntry
          id={COMMAND_ENTRY_ID}
          className="profile-offline-hint-command"
          text={command}
          ontextentrychange={restoreCommand}
        />
        <Button className="profile-offline-hint-select" onactivate={selectCommand}>
          <Label
            className="profile-offline-hint-select-label"
            text={$.Localize('#console_launch_select_button')}
          />
        </Button>
        <Label
          className="profile-offline-hint-copy"
          text={$.Localize('#console_launch_copy_hint')}
        />
      </Panel>
    </Panel>
  );
}
