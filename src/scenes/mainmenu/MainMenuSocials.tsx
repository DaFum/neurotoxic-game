import { useTranslation } from 'react-i18next'
import {
  Modal,
  UplinkButton,
  BandcampIcon,
  InstaIcon,
  TikTokIcon,
  YouTubeIcon,
  BlogIcon,
  GameIcon
} from '../../ui/shared'

/**
 * Renders the Main Menu Socials scene from onClose.
 * @param props - Close callback for the socials panel.
 * @returns The rendered Main Menu Socials UI.
 */
export const MainMenuSocials = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('ui:socials')}
      contentClassName=''
    >
      <div className='flex flex-col gap-3 sm:gap-4 max-w-md w-full mx-auto max-h-[calc(100svh-4rem)] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 sm:pr-2 pb-1'>
        <UplinkButton
          title={t('ui:social_links.game.title')}
          subtitle={t('ui:social_links.game.subtitle')}
          type={t('ui:social_links.type_system_core')}
          url='https://neurotoxic-game.vercel.app'
          Icon={GameIcon}
        />
        <UplinkButton
          title={t('ui:social_links.bandcamp.title')}
          subtitle={t('ui:social_links.bandcamp.subtitle')}
          type={t('ui:social_links.type_audio_vault')}
          url='https://neurotoxic.bandcamp.com'
          Icon={BandcampIcon}
        />
        <UplinkButton
          title={t('ui:social_links.instagram.title')}
          subtitle={t('ui:social_links.instagram.subtitle')}
          type={t('ui:social_links.type_visual_feed')}
          url='https://instagram.com/neurotoxicband'
          Icon={InstaIcon}
        />
        <UplinkButton
          title={t('ui:social_links.tiktok.title')}
          subtitle={t('ui:social_links.tiktok.subtitle')}
          type={t('ui:social_links.type_viral_stream')}
          url='https://tiktok.com/@neurotoxicband'
          Icon={TikTokIcon}
        />
        <UplinkButton
          title={t('ui:social_links.neurotoxic_once.title')}
          subtitle={t('ui:social_links.neurotoxic_once.subtitle')}
          type={t('ui:social_links.type_broadcast_a')}
          url='https://youtube.com/@neurotoxiconcechannel237'
          Icon={YouTubeIcon}
        />
        <UplinkButton
          title={t('ui:social_links.neurotoxic_3000.title')}
          subtitle={t('ui:social_links.neurotoxic_3000.subtitle')}
          type={t('ui:social_links.type_broadcast_b')}
          url='https://youtube.com/@neurotoxic3000'
          Icon={YouTubeIcon}
        />
        <UplinkButton
          title={t('ui:social_links.blog.title')}
          subtitle={t('ui:social_links.blog.subtitle')}
          type={t('ui:social_links.type_data_log')}
          url='https://neuroblogxic.blogspot.com'
          Icon={BlogIcon}
        />
      </div>
    </Modal>
  )
}
