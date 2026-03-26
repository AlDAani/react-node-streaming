import { Badge, Card, Heading, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import type { ProfilesResultsListModel } from '../../hooks/use-profiles-page-controller';
import { getDisplayHobbies, getDisplayName } from '../../utils/profile-view';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Profiles-results-list';

export const ProfilesResultsList = ({
  cardAgeLabel,
  cardHobbiesLabel,
  cardNationalityLabel,
  isLoadingMore,
  loadingLabel,
  measureElement,
  rows,
  showResults,
  totalSize,
  viewportRef,
}: ProfilesResultsListModel) => {
  if (!showResults) {
    return null;
  }

  return (
    <div className={cn(BLOCK_NAME)}>
      <div ref={viewportRef} className={cn(`${BLOCK_NAME}__virtual-viewport`)}>
        <div
          className={cn(`${BLOCK_NAME}__virtual-content`)}
          style={{
            height: `${totalSize}px`,
          }}
        >
          {rows.map((row) => {
            const hobbiesPreview = getDisplayHobbies(row.profile.hobbies);

            return (
              <Card
                className={cn(`${BLOCK_NAME}__card`)}
                key={row.key}
                ref={measureElement}
                size="2"
                data-index={row.index}
                style={{
                  left: 0,
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  transform: `translateY(${row.start}px)`,
                }}
              >
                <div className={cn(`${BLOCK_NAME}__card-header`)}>
                  <img
                    className={cn(`${BLOCK_NAME}__card-avatar`)}
                    src={row.profile.avatar || 'https://placehold.co/80x80'}
                    alt={getDisplayName(row.profile)}
                    loading="lazy"
                  />
                  <div className={cn(`${BLOCK_NAME}__card-content`)}>
                    <Heading as="h3" className={cn(`${BLOCK_NAME}__card-title`)} size="3">
                      {getDisplayName(row.profile)}
                    </Heading>
                    <div className={cn(`${BLOCK_NAME}__card-meta-grid`)}>
                      <Text as="p" className={cn(`${BLOCK_NAME}__card-meta`)} size="2">
                        <Text as="span" className={cn(`${BLOCK_NAME}__card-meta-label`)} size="1">
                          {cardNationalityLabel}
                        </Text>
                        {row.profile.nationality}
                      </Text>
                      <Text as="p" className={cn(`${BLOCK_NAME}__card-meta`)} size="2">
                        <Text as="span" className={cn(`${BLOCK_NAME}__card-meta-label`)} size="1">
                          {cardAgeLabel}
                        </Text>
                        {row.profile.age}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={cn(`${BLOCK_NAME}__card-footer`)}>
                  <Text as="p" className={cn(`${BLOCK_NAME}__card-hobbies-label`)} size="2">
                    {cardHobbiesLabel}
                  </Text>
                  <div className={cn(`${BLOCK_NAME}__card-hobbies`)}>
                    {hobbiesPreview.preview.length > 0 ? (
                      hobbiesPreview.preview.map((hobby) => (
                        <Badge key={`${row.profile.id}-${hobby}`} radius="full" variant="soft">
                          {hobby}
                        </Badge>
                      ))
                    ) : (
                      <Badge color="gray" radius="full" variant="soft">
                        -
                      </Badge>
                    )}
                    {hobbiesPreview.hiddenCount > 0 ? (
                      <Badge radius="full" variant="solid">
                        +{hobbiesPreview.hiddenCount}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {isLoadingMore ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__loading-more`)} size="2">
          {loadingLabel}
        </Text>
      ) : null}
    </div>
  );
};
