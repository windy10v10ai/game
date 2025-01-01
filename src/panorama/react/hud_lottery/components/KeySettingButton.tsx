import React, { useState } from 'react';

interface KeySettingButtonProps {
  abilityname: string;
  // bindKeyText: string;
}

const rootPanelStyle: Partial<VCSSStyleDeclaration> = {
  flowChildren: 'down',
  padding: '10px', // 内边距
  width: '100px', // 宽度
  borderRadius: '3px', // 圆角
};

const KeySettingButton: React.FC<KeySettingButtonProps> = ({ abilityname }) => {
  const [isActive, setIsActive] = useState(false);
  const [bindKeyText, setBindKeyText] = useState('');
  const [tempBindKeyText, setTempBindKeyText] = useState('');
  const validKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const setTempBindKey = (key: string) => {
    $.Msg('Set temp key: ', key);
    setIsActive(true);

    key = key.toUpperCase();
    if (validKeys.indexOf(key) === -1) {
      $.Msg('Invalid key: ', key);
      setTempBindKeyText('');
    } else {
      setTempBindKeyText(key);
    }
  };

  const setKeyBing = () => {
    setIsActive(false);

    if (validKeys.indexOf(tempBindKeyText) === -1) {
      $.Msg('Invalid key: ', tempBindKeyText);
      setBindKeyText('');
      setTempBindKeyText('');
    } else {
      // TODO 设置按键
      $.Msg('Set key: ', tempBindKeyText);
      setBindKeyText(tempBindKeyText);
    }
  };

  const textEntryClass = isActive ? ' ActiveArea Actived' : ' ActiveArea';
  const placeholderText = $.Localize('#key_bind_placeholder');
  const settingText = $.Localize('#key_bind_setting');

  return (
    <Panel style={rootPanelStyle} className="BindingRow">
      <DOTAAbilityImage abilityname={abilityname} showtooltip={true} />
      <Panel
        className="BindingContainer"
        onmouseactivate={() => {
          setIsActive(true);
        }}
      >
        <Label
          style={{ visibility: isActive ? 'collapse' : 'visible' }}
          className="BindingText"
          text={tempBindKeyText}
        />
        <TextEntry
          style={{ visibility: isActive ? 'visible' : 'collapse' }}
          className={textEntryClass}
          placeholder={placeholderText}
          maxchars={1}
          ontextentrychange={(textEntry) => {
            setTempBindKey(textEntry.text);
          }}
        />
      </Panel>
      <Label className="BindingButton" onmouseactivate={setKeyBing} text={settingText} />
    </Panel>
  );
};

export default KeySettingButton;
