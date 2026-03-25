import { Button, Card, Flex, Skeleton, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import type { ProfilesStatusPanelModel } from '../../hooks/use-profiles-page-controller';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Profiles-status-panel';

const LoadingSkeleton = ({ label }: { label: string }) => {
  return (
    <div className={cn(`${BLOCK_NAME}__skeleton-list`)} role="status" aria-live="polite">
      <Text as="p" className={cn(`${BLOCK_NAME}__loading-text`)}>
        {label}
      </Text>
      {Array.from({ length: 3 }, (_value, index) => (
        <Card className={cn(`${BLOCK_NAME}__skeleton-item`)} key={`skeleton-${index}`}>
          <Flex direction="column" gap="2">
            <Skeleton
              className={cn(`${BLOCK_NAME}__skeleton-line`, `${BLOCK_NAME}__skeleton-line--title`)}
            />
            <Skeleton className={cn(`${BLOCK_NAME}__skeleton-line`)} />
            <Skeleton
              className={cn(`${BLOCK_NAME}__skeleton-line`, `${BLOCK_NAME}__skeleton-line--short`)}
            />
          </Flex>
        </Card>
      ))}
    </div>
  );
};

type ProfilesStatusPanelProps = {
  model: ProfilesStatusPanelModel;
};

export const ProfilesStatusPanel = ({ model }: ProfilesStatusPanelProps) => {
  if (!model.showLoading && !model.showError && !model.showEmpty) {
    return null;
  }

  return (
    <div className={cn(BLOCK_NAME)}>
      {model.showLoading ? <LoadingSkeleton label={model.loadingLabel} /> : null}

      {model.showError ? (
        <Card className={cn(`${BLOCK_NAME}__error-block`)} role="alert">
          <Flex direction="column" gap="2">
            <Text as="p" color="red" className={cn(`${BLOCK_NAME}__error-text`)}>
              {model.errorMessage}
            </Text>
            <Button color="red" variant="soft" type="button" onClick={model.onRetry}>
              {model.retryLabel}
            </Button>
          </Flex>
        </Card>
      ) : null}

      {model.showEmpty ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__empty`)}>
          {model.emptyLabel}
        </Text>
      ) : null}
    </div>
  );
};
