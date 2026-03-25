import { Badge, Button, Callout, Card, Heading, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import i18next from 'i18next';
import { STREAM_READER_TRANSLATIONS } from '@/constants/i18next/stream-reader-translations';
import { StreamOutput } from './components/stream-output';
import { type StreamStatus, useStreamReaderController } from './hooks/use-stream-reader-controller';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Stream-reader-page';

const STREAM_STATUS_TRANSLATIONS: Record<StreamStatus, string> = {
  idle: STREAM_READER_TRANSLATIONS.idle,
  connecting: STREAM_READER_TRANSLATIONS.connecting,
  streaming: STREAM_READER_TRANSLATIONS.streaming,
  stopped: STREAM_READER_TRANSLATIONS.stopped,
  done: STREAM_READER_TRANSLATIONS.done,
  error: STREAM_READER_TRANSLATIONS.error,
};

const STREAM_STATUS_COLORS: Record<StreamStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  idle: 'gray',
  connecting: 'blue',
  streaming: 'blue',
  stopped: 'gray',
  done: 'green',
  error: 'red',
};

export const StreamReaderPage = () => {
  const { status, displayedText, errorMessage, start, stop } = useStreamReaderController();

  return (
    <section className={cn(BLOCK_NAME)}>
      <header className={cn(`${BLOCK_NAME}__header`)}>
        <Heading as="h2" className={cn(`${BLOCK_NAME}__title`)} size="5">
          {i18next.t(STREAM_READER_TRANSLATIONS.title)}
        </Heading>
        <Text as="p" className={cn(`${BLOCK_NAME}__subtitle`)}>
          {i18next.t(STREAM_READER_TRANSLATIONS.description)}
        </Text>
      </header>

      <div className={cn(`${BLOCK_NAME}__actions`)}>
        <Button
          variant="soft"
          type="button"
          disabled={status === 'connecting' || status === 'streaming'}
          onClick={() => void start()}
        >
          {i18next.t(STREAM_READER_TRANSLATIONS.start)}
        </Button>
        <Button
          variant="soft"
          type="button"
          disabled={status !== 'connecting' && status !== 'streaming'}
          onClick={stop}
        >
          {i18next.t(STREAM_READER_TRANSLATIONS.stop)}
        </Button>
      </div>

      <Badge color={STREAM_STATUS_COLORS[status]} variant="soft">
        {i18next.t(STREAM_STATUS_TRANSLATIONS[status])}
      </Badge>

      {status === 'error' ? (
        <Callout.Root color="red" variant="soft">
          <Callout.Text>{errorMessage}</Callout.Text>
        </Callout.Root>
      ) : null}

      <Card asChild>
        <section aria-live="polite" className={cn(`${BLOCK_NAME}__output`)}>
          <Heading as="h3" className={cn(`${BLOCK_NAME}__output-title`)} size="4">
            {i18next.t(STREAM_READER_TRANSLATIONS.outputLabel)}
          </Heading>
          <StreamOutput text={displayedText} />
        </section>
      </Card>
    </section>
  );
};
