/**
 * WalkthroughChapter.jsx
 * Generic chapter renderer. Reads :n from the URL and delegates to StoryPage.
 */

import { useParams, Navigate } from 'react-router-dom'
import { CHAPTERS } from '../../data/walkthroughData'
import StoryPage from '../../components/Walkthrough/StoryPage'

export default function WalkthroughChapter() {
  const { n } = useParams()
  const chapter = CHAPTERS.find((c) => c.n === parseInt(n, 10))

  if (!chapter) {
    return <Navigate to="/walkthrough" replace />
  }

  return <StoryPage chapter={chapter} allChapters={CHAPTERS} />
}
