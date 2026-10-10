import React, { useEffect, useRef, useState } from 'react';

type FeedbackType = FeedbackSubmitEventData['type'];
type SendState = 'idle' | 'sending' | FeedbackResult;

const MAX_TOPICS = 2;
const MAX_DESCRIPTION_LENGTH = 1000;
// 固定两行等宽排列，换语言后标签长短不同也不会换行错位
const TOPIC_ROWS = [
  ['hero', 'ability', 'awaken', 'item', 'bot'],
  ['balance', 'ui', 'member', 'lag', 'launcher'],
];

const RESULT_TEXT: Partial<Record<SendState, string>> = {
  sent: '#feedback_thanks',
  failed: '#feedback_failed',
  too_many_reports: '#feedback_too_many',
  daily_limit_reached: '#feedback_daily_limit',
};

// 关掉个人主页再打开时保留已填内容，失败后回来还能接着发
const draft = { type: 'problem' as FeedbackType, topics: [] as string[], description: '' };

/** 个人主页的反馈页：选类型与相关内容，写描述后发给服务端 */
export function FeedbackTab() {
  const [type, setType] = useState<FeedbackType>(draft.type);
  const [topics, setTopics] = useState<string[]>(draft.topics);
  const [description, setDescription] = useState(draft.description);
  const [sendState, setSendState] = useState<SendState>('idle');
  const entryRef = useRef<TextEntry | null>(null);

  useEffect(() => {
    draft.type = type;
    draft.topics = topics;
    draft.description = description;
  }, [type, topics, description]);

  // 不用 text 属性受控：每次渲染回写会打断输入法的组字。
  // 输入框随类型重建（提示语只能在创建时设置），重建后把已填内容写回
  useEffect(() => {
    if (entryRef.current) entryRef.current.text = draft.description;
  }, [type]);

  useEffect(() => {
    const listener = GameEvents.Subscribe('feedback_result', (data) => {
      setSendState(data.result);
      if (data.result !== 'sent') return;
      setTopics([]);
      setDescription('');
      if (entryRef.current) entryRef.current.text = '';
    });
    return () => GameEvents.Unsubscribe(listener);
  }, []);

  const suggesting = type === 'suggestion';
  const sending = sendState === 'sending';
  const canSend = !sending && description.trim() !== '';
  const resultText = RESULT_TEXT[sendState];
  const failed = sendState !== 'idle' && sendState !== 'sending' && sendState !== 'sent';

  const toggleTopic = (topic: string) => {
    if (topics.includes(topic)) {
      setTopics(topics.filter((t) => t !== topic));
    } else if (topics.length < MAX_TOPICS) {
      setTopics([...topics, topic]);
    }
  };

  const send = () => {
    if (!canSend) return;
    setSendState('sending');
    GameEvents.SendCustomGameEventToServer('feedback_submit', {
      type,
      topics: topics.join(','),
      description,
    });
  };

  return (
    <Panel className="feedback-tab">
      <Panel className="feedback-form">
        <Panel className="feedback-type-bar">
          {(['problem', 'suggestion'] as FeedbackType[]).map((t) => (
            <Button
              key={t}
              className={`feedback-type-btn ${type === t ? 'feedback-type-btn-active' : ''}`}
              onactivate={() => setType(t)}
            >
              <Label text={$.Localize(`#feedback_type_${t}`)} />
            </Button>
          ))}
        </Panel>

        <Panel className="feedback-row">
          <Label className="feedback-label" text={$.Localize('#feedback_related_to')} />
          <Label className="feedback-hint" text={$.Localize('#feedback_up_to_two')} />
        </Panel>
        {TOPIC_ROWS.map((row, rowIndex) => (
          <Panel key={rowIndex} className="feedback-topic-row">
            {row.map((topic, index) => {
              const selected = topics.includes(topic);
              const full = !selected && topics.length >= MAX_TOPICS;
              return (
                <Button
                  key={topic}
                  className={`feedback-chip ${index > 0 ? 'feedback-chip-gap' : ''} ${
                    selected ? 'feedback-chip-selected' : ''
                  } ${full ? 'feedback-chip-full' : ''}`}
                  onactivate={() => toggleTopic(topic)}
                >
                  <Label text={$.Localize(`#feedback_topic_${topic}`)} />
                </Button>
              );
            })}
          </Panel>
        ))}

        <Panel className="feedback-row feedback-row-description">
          <Label className="feedback-label" text={$.Localize('#feedback_description')} />
          <Label className="feedback-required" text="*" />
          <Label
            className="feedback-hint feedback-count"
            text={`${description.length} / ${MAX_DESCRIPTION_LENGTH}`}
          />
        </Panel>
        <TextEntry
          key={type}
          ref={entryRef}
          className="feedback-entry"
          multiline={true}
          maxchars={MAX_DESCRIPTION_LENGTH}
          placeholder={$.Localize(
            suggesting ? '#feedback_suggestion_cue' : '#feedback_problem_cue',
          )}
          ontextentrychange={(panel) => {
            setDescription(panel.text);
            // 开始写下一条时收起致谢，失败提示留到重发。发送成功后代码清空输入框也会触发本事件，空串不算
            if (sendState === 'sent' && panel.text !== '') setSendState('idle');
          }}
        />

        <Label
          className={`feedback-result ${failed ? 'feedback-result-failed' : ''}`}
          text={resultText ? $.Localize(resultText) : ''}
          style={{ visibility: resultText ? 'visible' : 'collapse' }}
        />

        <Panel className="feedback-footer">
          <Label className="feedback-hint" text={$.Localize('#feedback_game_state_hint')} />
          <Button className="btn-primary feedback-send-btn" enabled={canSend} onactivate={send}>
            <Label
              className="btn-primary-label"
              text={$.Localize(
                sending ? '#feedback_sending' : failed ? '#feedback_resend' : '#feedback_send',
              )}
            />
          </Button>
        </Panel>
      </Panel>
    </Panel>
  );
}
