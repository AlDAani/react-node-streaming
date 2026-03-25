import { Badge, Button, Card, Heading, Text, TextField } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import type { ProfilesFacetEntry } from '@/api/profiles';
import type { ProfilesFiltersSidebarModel } from '../../hooks/use-profiles-page-controller';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Profiles-filters-sidebar';

type FacetFilterGroupProps = {
  allLabel: string;
  entries: ProfilesFacetEntry[];
  onSelect: (value: string) => void;
  selectedValue: string;
  title: string;
};

const FacetFilterGroup = ({
  allLabel,
  entries,
  onSelect,
  selectedValue,
  title,
}: FacetFilterGroupProps) => {
  return (
    <Card asChild size="1">
      <section className={cn(`${BLOCK_NAME}__filter-group`)}>
        <Heading as="h3" size="3" className={cn(`${BLOCK_NAME}__filter-title`)}>
          {title}
        </Heading>

        <div className={cn(`${BLOCK_NAME}__filter-list`)}>
          <Button
            className={cn(`${BLOCK_NAME}__filter-item`)}
            color={!selectedValue ? 'blue' : 'gray'}
            variant={!selectedValue ? 'solid' : 'soft'}
            type="button"
            onClick={() => onSelect('')}
          >
            <Text as="span" size="2">
              {allLabel}
            </Text>
          </Button>

          {entries.map((entry) => {
            const isActive = selectedValue === entry.value;

            return (
              <Button
                className={cn(`${BLOCK_NAME}__filter-item`)}
                color={isActive ? 'blue' : 'gray'}
                variant={isActive ? 'solid' : 'soft'}
                type="button"
                key={entry.value}
                onClick={() => onSelect(entry.value)}
              >
                <Text as="span" size="2" className={cn(`${BLOCK_NAME}__filter-item-value`)}>
                  {entry.value}
                </Text>
                <Badge color={isActive ? 'blue' : 'gray'} radius="full" variant="surface">
                  {entry.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </section>
    </Card>
  );
};

type ProfilesFiltersSidebarProps = {
  model: ProfilesFiltersSidebarModel;
};

export const ProfilesFiltersSidebar = ({ model }: ProfilesFiltersSidebarProps) => {
  return (
    <div className={cn(BLOCK_NAME)}>
      <label className={cn(`${BLOCK_NAME}__field`)}>
        <Text as="span" className={cn(`${BLOCK_NAME}__field-label`)} size="2">
          {model.searchLabel}
        </Text>
        <TextField.Root
          className={cn(`${BLOCK_NAME}__input`)}
          size="2"
          type="search"
          value={model.searchInput}
          onChange={(event) => model.onSearchChange(event.target.value)}
          placeholder={model.searchPlaceholder}
        />
      </label>

      <FacetFilterGroup
        allLabel={model.allOptionLabel}
        entries={model.topNationalities}
        onSelect={model.onNationalitySelect}
        selectedValue={model.selectedNationality}
        title={model.nationalityLabel}
      />

      <FacetFilterGroup
        allLabel={model.allOptionLabel}
        entries={model.topHobbies}
        onSelect={model.onHobbySelect}
        selectedValue={model.selectedHobby}
        title={model.hobbyLabel}
      />
    </div>
  );
};
