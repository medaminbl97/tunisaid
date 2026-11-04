import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/arrow-right-white.svg'
import { CtaBanner } from '#/components/cta-banner'
import { Button } from '#/components/ui/button'

export function WorkInvitation() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="work-invitation-title"
      className="bg-brand-flow-from-sun px-6 py-16 sm:px-10"
    >
      <div className="mx-auto max-w-[75rem]">
        <CtaBanner
          id="work-invitation-title"
          tone="peach"
          eyebrow={t('work.invitation.eyebrow')}
          title={t('work.invitation.title')}
          description={t('work.invitation.description')}
          actions={
            <>
              <Button asChild size="cta" shape="pill">
                <Link to="/donate">
                  {t('work.invitation.support')}
                  <img src={arrowRight} alt="" width={18} height={18} />
                </Link>
              </Button>
              <Button asChild size="cta" shape="pill" variant="brandOutline">
                <Link to="/contact">{t('work.invitation.contact')}</Link>
              </Button>
            </>
          }
        />
      </div>
    </section>
  )
}
