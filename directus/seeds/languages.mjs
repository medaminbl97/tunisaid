export const languageSeeds = [
  ['en', 'English'],
  ['de', 'Deutsch'],
]

export async function seedLanguages({ ensure }) {
  for (const [id, name] of languageSeeds) {
    await ensure('languages', { id: { _eq: id } }, { id, name })
  }
}
