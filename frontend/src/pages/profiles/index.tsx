import { Heading } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import { ProfilesFiltersSidebar } from './components/profiles-filters-sidebar';
import { ProfilesResultsList } from './components/profiles-results-list';
import { ProfilesStatusPanel } from './components/profiles-status-panel';
import { useProfilesPageController } from './hooks/use-profiles-page-controller';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Profiles-page';

export const ProfilesPage = () => {
  const controller = useProfilesPageController();

  return (
    <section className={cn(BLOCK_NAME)}>
      <header className={cn(`${BLOCK_NAME}__header`)}>
        <Heading as="h2" className={cn(`${BLOCK_NAME}__title`)} size="5">
          {controller.title}
        </Heading>
      </header>

      <div className={cn(`${BLOCK_NAME}__layout`)}>
        <aside className={cn(`${BLOCK_NAME}__sidebar`)}>
          <ProfilesFiltersSidebar model={controller.filters} />
        </aside>

        <div className={cn(`${BLOCK_NAME}__content`)}>
          <ProfilesStatusPanel model={controller.status} />
          <ProfilesResultsList {...controller.results} />
        </div>
      </div>
    </section>
  );
};
