import { Link } from 'react-router-dom';
import { Heading, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import i18next from 'i18next';
import { HOME_BLOCK_NAME, HOME_FEATURE_LINKS } from './constants';
import { HOME_TRANSLATIONS } from './constants/translations';

import styles from './index.module.scss';

const cn = classnames.bind(styles);

export const HomePage = () => {
  return (
    <section className={cn(HOME_BLOCK_NAME)}>
      <header className={cn(`${HOME_BLOCK_NAME}__header`)}>
        <Heading as="h2" className={cn(`${HOME_BLOCK_NAME}__title`)} size="5">
          {i18next.t(HOME_TRANSLATIONS.title)}
        </Heading>
        <Text as="p" className={cn(`${HOME_BLOCK_NAME}__subtitle`)}>
          {i18next.t(HOME_TRANSLATIONS.subtitle)}
        </Text>
      </header>

      <div className={cn(`${HOME_BLOCK_NAME}__feature-grid`)}>
        {HOME_FEATURE_LINKS.map(({ path, titleKey, descriptionKey }) => (
          <Link className={cn(`${HOME_BLOCK_NAME}__feature-card`)} key={path} to={path}>
            <Heading as="h3" className={cn(`${HOME_BLOCK_NAME}__feature-title`)} size="4">
              {i18next.t(titleKey)}
            </Heading>
            <Text as="p" className={cn(`${HOME_BLOCK_NAME}__feature-description`)}>
              {i18next.t(descriptionKey)}
            </Text>
          </Link>
        ))}
      </div>
    </section>
  );
};
