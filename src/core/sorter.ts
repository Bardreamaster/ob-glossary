export function sortGlossaryText(text: string, insertEmptyLineAfterHeading: boolean = true): string {
    // Cut the text into parts based on the fourth-level headings (####)
    const parts = text.split(/^(?=####\s)/m);

    if (parts.length <= 1) {
        return text;
    }

    // the part before the first concept
    let header = parts[0];
    const concepts = parts.slice(1);

    // keep part[0] two empty lines away from the first concept
    if (header && header.trim() !== '') {
        header = header.trimEnd() + '\n\n';
    } else {
        header = '';
    }

    // Sort the concepts
    concepts.sort((a, b) => {
        const titleA = a.match(/^####\s+(.*)/)?.[1]?.trim() ?? '';
        const titleB = b.match(/^####\s+(.*)/)?.[1]?.trim() ?? '';

        // alphabetical order, case-insensitive
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
    });


    // reorganize the texts of each concept
    const sortedBody = concepts.map(term => {
        let cleanTerm = term.trimEnd();

        if (insertEmptyLineAfterHeading) {
            // keep only one empty line after the heading
            cleanTerm = cleanTerm.replace(/^(####\s+.*?)\n+/m, '$1\n\n');
        }

        return cleanTerm;
    }).join('\n\n'); // ensure two empty lines between concepts

    // combine the first part and sorted concepts
    return header + sortedBody + '\n';
}
