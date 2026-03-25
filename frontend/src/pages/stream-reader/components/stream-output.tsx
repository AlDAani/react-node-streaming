import { memo } from 'react';
import { ScrollArea, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';

import styles from '../index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Stream-reader-page';

type StreamOutputProps = {
  text: string;
};

export const StreamOutput = memo(({ text }: StreamOutputProps) => {
  return (
    <ScrollArea className={cn(`${BLOCK_NAME}__output-scroll`)} type="auto">
      <Text as="p" className={cn(`${BLOCK_NAME}__output-text`)}>
        {text}
      </Text>
    </ScrollArea>
  );
});

StreamOutput.displayName = 'StreamOutput';
