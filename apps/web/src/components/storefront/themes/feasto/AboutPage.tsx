'use client'

import type { AboutPageProps } from '../_types'
import { AboutHeroSection } from './sections/about/AboutHeroSection'
import { AboutStorySection } from './sections/about/AboutStorySection'
import { AboutTimelineSection } from './sections/about/AboutTimelineSection'
import { AboutTeamSection } from './sections/about/AboutTeamSection'
import { LocationsSection } from './sections/home/LocationsSection'

export function AboutPage({
  restaurant,
  theme,
  sections,
  openingHours,
  dynamicTeam,
}: AboutPageProps & { dynamicTeam?: Array<{ id: string; name: string; position: string; avatar: string | null; socialLink?: string }> }) {
  return (
    <div>
      <AboutHeroSection
        restaurant={restaurant}
        theme={theme}
        sectionData={sections?.hero}
      />
      <div id="page-content-start" />
      <AboutStorySection
        theme={theme}
        sectionData={sections?.story}
      />
      <AboutTimelineSection
        theme={theme}
        sectionData={sections?.timeline}
      />
      <AboutTeamSection
        theme={theme}
        sectionData={sections?.team}
        dynamicTeam={dynamicTeam}
      />
      <LocationsSection
        theme={theme}
        sectionData={sections?.locations}
        restaurant={restaurant}
        openingHours={openingHours}
      />
    </div>
  )
}
