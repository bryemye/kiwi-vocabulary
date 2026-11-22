"""Utilities for converting ARPAbet/IPA pronunciations into student-friendly
phonetic respellings (e.g., 'AW-dit' for 'audit').
"""

from __future__ import annotations

import re

VOWELS = {
    'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER',
    'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW',
}
SHORT_VOWELS = {'AE', 'EH', 'IH', 'AH', 'UH', 'AA'}

ONSETS_2 = {
    ('P', 'L'), ('P', 'R'), ('B', 'L'), ('B', 'R'), ('T', 'R'), ('D', 'R'),
    ('K', 'L'), ('K', 'R'), ('K', 'W'), ('G', 'L'), ('G', 'R'), ('G', 'W'),
    ('F', 'L'), ('F', 'R'), ('TH', 'R'), ('SH', 'R'),
    ('S', 'P'), ('S', 'T'), ('S', 'K'), ('S', 'M'), ('S', 'N'), ('S', 'L'), ('S', 'W'), ('S', 'F'),
    ('T', 'W'), ('D', 'W'), ('TH', 'W'),
    ('P', 'Y'), ('B', 'Y'), ('K', 'Y'), ('G', 'Y'), ('F', 'Y'), ('V', 'Y'), ('HH', 'Y'), ('M', 'Y'),
}
ONSETS_3 = {
    ('S', 'P', 'L'), ('S', 'P', 'R'), ('S', 'T', 'R'), ('S', 'K', 'R'), ('S', 'K', 'W'),
}

CONS_MAP = {
    'P': 'p', 'B': 'b', 'T': 't', 'D': 'd', 'K': 'k', 'G': 'g',
    'F': 'f', 'V': 'v', 'TH': 'th', 'DH': 'th', 'S': 's', 'Z': 'z',
    'SH': 'sh', 'ZH': 'zh', 'HH': 'h', 'M': 'm', 'N': 'n', 'NG': 'ng',
    'L': 'l', 'R': 'r', 'W': 'w', 'Y': 'y', 'CH': 'ch', 'JH': 'j',
}

# Explicit ARPAbet overrides for words missing from CMUdict, heteronyms whose
# definition/POS requires a specific variant, and known CMUdict quirks.
ARPABET_OVERRIDES: dict[str, list[str]] = {
    # CMUdict stress/variant fixes & heteronyms
    'abstract': ['AE1', 'B', 'S', 'T', 'R', 'AE2', 'K', 'T'],
    'advocate': ['AE1', 'D', 'V', 'AH0', 'K', 'AH0', 'T'],
    'aggregate': ['AE1', 'G', 'R', 'AH0', 'G', 'AH0', 'T'],
    'alchemist': ['AE1', 'L', 'K', 'AH0', 'M', 'IH0', 'S', 'T'],
    'antipodes': ['AE0', 'N', 'T', 'IH1', 'P', 'AH0', 'D', 'IY2', 'Z'],
    'assiduous': ['AH0', 'S', 'IH1', 'JH', 'UW0', 'AH0', 'S'],
    'asynchronous': ['EY0', 'S', 'IH1', 'NG', 'K', 'R', 'AH0', 'N', 'AH0', 'S'],
    'audacious': ['AO0', 'D', 'EY1', 'SH', 'AH0', 'S'],
    'audacity': ['AO0', 'D', 'AE1', 'S', 'AH0', 'T', 'IY0'],
    'chastise': ['CH', 'AE2', 'S', 'T', 'AY1', 'Z'],
    'malodorous': ['M', 'AE2', 'L', 'OW1', 'D', 'ER0', 'AH0', 'S'],
    'convict': ['K', 'AH0', 'N', 'V', 'IH1', 'K', 'T'],
    'corps': ['K', 'AO1', 'R'],
    'correlate': ['K', 'AO1', 'R', 'AH0', 'L', 'EY2', 'T'],
    'desecrate': ['D', 'EH1', 'S', 'AH0', 'K', 'R', 'EY2', 'T'],
    'diffuse': ['D', 'IH0', 'F', 'Y', 'UW1', 'S'],
    'direct': ['D', 'IH0', 'R', 'EH1', 'K', 'T'],
    'duration': ['D', 'UW0', 'R', 'EY1', 'SH', 'AH0', 'N'],
    'duress': ['D', 'UW0', 'R', 'EH1', 'S'],
    'excise': ['IH0', 'K', 'S', 'AY1', 'Z'],
    'extract': ['IH0', 'K', 'S', 'T', 'R', 'AE1', 'K', 'T'],
    'forthright': ['F', 'AO1', 'R', 'TH', 'R', 'AY2', 'T'],
    'invigorate': ['IH0', 'N', 'V', 'IH1', 'G', 'ER0', 'EY2', 'T'],
    'magnate': ['M', 'AE1', 'G', 'N', 'EY2', 'T'],
    'nominate': ['N', 'AA1', 'M', 'AH0', 'N', 'EY2', 'T'],
    'nonchalance': ['N', 'AA2', 'N', 'SH', 'AH0', 'L', 'AA1', 'N', 'S'],
    'plaintively': ['P', 'L', 'EY1', 'N', 'T', 'IH0', 'V', 'L', 'IY0'],
    'plethora': ['P', 'L', 'EH1', 'TH', 'ER0', 'AH0'],
    'polyglot': ['P', 'AA1', 'L', 'IY2', 'G', 'L', 'AA0', 'T'],
    'prerogative': ['P', 'R', 'IH0', 'R', 'AA1', 'G', 'AH0', 'T', 'IH0', 'V'],
    'promiscuity': ['P', 'R', 'AA2', 'M', 'IH0', 'S', 'K', 'Y', 'UW1', 'AH0', 'T', 'IY0'],
    'promiscuous': ['P', 'R', 'AH0', 'M', 'IH1', 'S', 'K', 'Y', 'UW0', 'AH0', 'S'],
    'rebel': ['R', 'IH0', 'B', 'EH1', 'L'],
    'record': ['R', 'IH0', 'K', 'AO1', 'R', 'D'],
    'regress': ['R', 'IH0', 'G', 'R', 'EH1', 'S'],
    'reprobate': ['R', 'EH1', 'P', 'R', 'AH0', 'B', 'EY2', 'T'],
    'segment': ['S', 'EH1', 'G', 'M', 'AH0', 'N', 'T'],
    'syndicate': ['S', 'IH1', 'N', 'D', 'AH0', 'K', 'AH0', 'T'],
    'torment': ['T', 'AO1', 'R', 'M', 'EH2', 'N', 'T'],
    # Words missing from both CMUdict and existing IPA
    'acclivity': ['AH0', 'K', 'L', 'IH1', 'V', 'AH0', 'T', 'IY0'],
    'acrophobia': ['AE2', 'K', 'R', 'AH0', 'F', 'OW1', 'B', 'IY0', 'AH0'],
    'adumbrate': ['AE1', 'D', 'AH0', 'M', 'B', 'R', 'EY2', 'T'],
    'agonistic': ['AE2', 'G', 'AH0', 'N', 'IH1', 'S', 'T', 'IH0', 'K'],
    'anastrophe': ['AH0', 'N', 'AE1', 'S', 'T', 'R', 'AH0', 'F', 'IY0'],
    'anthropoid': ['AE1', 'N', 'TH', 'R', 'AH0', 'P', 'OY2', 'D'],
    'anticlimax': ['AE2', 'N', 'T', 'IY0', 'K', 'L', 'AY1', 'M', 'AE2', 'K', 'S'],
    'antiphonal': ['AE0', 'N', 'T', 'IH1', 'F', 'AH0', 'N', 'AH0', 'L'],
    'antistrophe': ['AE0', 'N', 'T', 'IH1', 'S', 'T', 'R', 'AH0', 'F', 'IY0'],
    'antonym': ['AE1', 'N', 'T', 'AH0', 'N', 'IH2', 'M'],
    'arachnophobia': ['AH0', 'R', 'AE2', 'K', 'N', 'AH0', 'F', 'OW1', 'B', 'IY0', 'AH0'],
    'audient': ['AO1', 'D', 'IY0', 'AH0', 'N', 'T'],
    'autodidact': ['AO2', 'T', 'OW0', 'D', 'AY1', 'D', 'AE2', 'K', 'T'],
    'bibliomania': ['B', 'IH2', 'B', 'L', 'IY0', 'OW0', 'M', 'EY1', 'N', 'IY0', 'AH0'],
    'bibliophile': ['B', 'IH1', 'B', 'L', 'IY0', 'AH0', 'F', 'AY2', 'L'],
    'bisect': ['B', 'AY0', 'S', 'EH1', 'K', 'T'],
    'breviary': ['B', 'R', 'IY1', 'V', 'IY0', 'EH2', 'R', 'IY0'],
    'breviloquent': ['B', 'R', 'IH0', 'V', 'IH1', 'L', 'AH0', 'K', 'W', 'AH0', 'N', 'T'],
    'briefness': ['B', 'R', 'IY1', 'F', 'N', 'AH0', 'S'],
    'candelabrum': ['K', 'AE2', 'N', 'D', 'AH0', 'L', 'AA1', 'B', 'R', 'AH0', 'M'],
    'candescence': ['K', 'AE0', 'N', 'D', 'EH1', 'S', 'AH0', 'N', 'S'],
    'candidness': ['K', 'AE1', 'N', 'D', 'IH0', 'D', 'N', 'AH0', 'S'],
    'chronometer': ['K', 'R', 'AH0', 'N', 'AA1', 'M', 'AH0', 'T', 'ER0'],
    'circumlocution': ['S', 'ER2', 'K', 'AH0', 'M', 'L', 'OW0', 'K', 'Y', 'UW1', 'SH', 'AH0', 'N'],
    'clamorous': ['K', 'L', 'AE1', 'M', 'ER0', 'AH0', 'S'],
    'cobelligerent': ['K', 'OW2', 'B', 'AH0', 'L', 'IH1', 'JH', 'ER0', 'AH0', 'N', 'T'],
    'confabulate': ['K', 'AH0', 'N', 'F', 'AE1', 'B', 'Y', 'AH0', 'L', 'EY2', 'T'],
    'contemporize': ['K', 'AH0', 'N', 'T', 'EH1', 'M', 'P', 'ER0', 'AY2', 'Z'],
    'declivity': ['D', 'IH0', 'K', 'L', 'IH1', 'V', 'AH0', 'T', 'IY0'],
    'degustation': ['D', 'IY2', 'G', 'AH0', 'S', 'T', 'EY1', 'SH', 'AH0', 'N'],
    'deodorize': ['D', 'IY0', 'OW1', 'D', 'ER0', 'AY2', 'Z'],
    'diffident': ['D', 'IH1', 'F', 'AH0', 'D', 'AH0', 'N', 'T'],
    'dipsomania': ['D', 'IH2', 'P', 'S', 'AH0', 'M', 'EY1', 'N', 'IY0', 'AH0'],
    'disgustful': ['D', 'IH0', 'S', 'G', 'AH1', 'S', 'T', 'F', 'UH0', 'L'],
    'dyskinesia': ['D', 'IH2', 'S', 'K', 'IH0', 'N', 'IY1', 'ZH', 'AH0'],
    'epistrophe': ['IH0', 'P', 'IH1', 'S', 'T', 'R', 'AH0', 'F', 'IY0'],
    'equidistant': ['IY2', 'K', 'W', 'IH0', 'D', 'IH1', 'S', 'T', 'AH0', 'N', 'T'],
    'extemporaneous': ['IH0', 'K', 'S', 'T', 'EH2', 'M', 'P', 'ER0', 'EY1', 'N', 'IY0', 'AH0', 'S'],
    'fatuity': ['F', 'AH0', 'T', 'UW1', 'AH0', 'T', 'IY0'],
    'fatuousness': ['F', 'AE1', 'CH', 'UW0', 'AH0', 'S', 'N', 'AH0', 'S'],
    'gustative': ['G', 'AH1', 'S', 'T', 'AH0', 'T', 'IH0', 'V'],
    'gustatory': ['G', 'AH1', 'S', 'T', 'AH0', 'T', 'AO2', 'R', 'IY0'],
    'hydrophobia': ['HH', 'AY2', 'D', 'R', 'AH0', 'F', 'OW1', 'B', 'IY0', 'AH0'],
    'hyperventilate': ['HH', 'AY2', 'P', 'ER0', 'V', 'EH1', 'N', 'T', 'AH0', 'L', 'EY2', 'T'],
    'hypoallergenic': ['HH', 'AY2', 'P', 'OW0', 'AE2', 'L', 'ER0', 'JH', 'EH1', 'N', 'IH0', 'K'],
    'hypothyroidism': ['HH', 'AY2', 'P', 'OW0', 'TH', 'AY1', 'R', 'OY2', 'D', 'IH2', 'Z', 'AH0', 'M'],
    'impugnable': ['IH0', 'M', 'P', 'Y', 'UW1', 'N', 'AH0', 'B', 'AH0', 'L'],
    'indurate': ['IH1', 'N', 'D', 'Y', 'UH0', 'R', 'EY2', 'T'],
    'inerrant': ['IH0', 'N', 'EH1', 'R', 'AH0', 'N', 'T'],
    'inexpugnable': ['IH2', 'N', 'IH0', 'K', 'S', 'P', 'AH1', 'G', 'N', 'AH0', 'B', 'AH0', 'L'],
    'ingress': ['IH1', 'N', 'G', 'R', 'EH2', 'S'],
    'inodorous': ['IH0', 'N', 'OW1', 'D', 'ER0', 'AH0', 'S'],
    'isomorphic': ['AY2', 'S', 'AH0', 'M', 'AO1', 'R', 'F', 'IH0', 'K'],
    'kinesthesia': ['K', 'IH2', 'N', 'AH0', 'S', 'TH', 'IY1', 'ZH', 'AH0'],
    'kleptomania': ['K', 'L', 'EH2', 'P', 'T', 'AH0', 'M', 'EY1', 'N', 'IY0', 'AH0'],
    'lycanthrope': ['L', 'AY1', 'K', 'AH0', 'N', 'TH', 'R', 'OW2', 'P'],
    'malediction': ['M', 'AE2', 'L', 'AH0', 'D', 'IH1', 'K', 'SH', 'AH0', 'N'],
    'magniloquent': ['M', 'AE0', 'G', 'N', 'IH1', 'L', 'AH0', 'K', 'W', 'AH0', 'N', 'T'],
    'malodorous': ['M', 'AE0', 'L', 'OW1', 'D', 'ER0', 'AH0', 'S'],
    'monomania': ['M', 'AA2', 'N', 'OW0', 'M', 'EY1', 'N', 'IY0', 'AH0'],
    'mutability': ['M', 'Y', 'UW2', 'T', 'AH0', 'B', 'IH1', 'L', 'AH0', 'T', 'IY0'],
    'nescience': ['N', 'EH1', 'SH', 'AH0', 'N', 'S'],
    'noninvasive': ['N', 'AA2', 'N', 'IH0', 'N', 'V', 'EY1', 'S', 'IH0', 'V'],
    'odoriferous': ['OW2', 'D', 'ER0', 'IH1', 'F', 'ER0', 'AH0', 'S'],
    'omnicompetent': ['AA2', 'M', 'N', 'IY0', 'K', 'AA1', 'M', 'P', 'AH0', 'T', 'AH0', 'N', 'T'],
    'omnifarious': ['AA2', 'M', 'N', 'AH0', 'F', 'EH1', 'R', 'IY0', 'AH0', 'S'],
    'panchromatic': ['P', 'AE2', 'N', 'K', 'R', 'OW0', 'M', 'AE1', 'T', 'IH0', 'K'],
    'pansophy': ['P', 'AE1', 'N', 'S', 'AH0', 'F', 'IY0'],
    'pellucid': ['P', 'AH0', 'L', 'UW1', 'S', 'IH0', 'D'],
    'perfidious': ['P', 'ER0', 'F', 'IH1', 'D', 'IY0', 'AH0', 'S'],
    'philology': ['F', 'IH0', 'L', 'AA1', 'L', 'AH0', 'JH', 'IY0'],
    'plenipotentiary': ['P', 'L', 'EH2', 'N', 'AH0', 'P', 'AH0', 'T', 'EH1', 'N', 'SH', 'ER0', 'IY0'],
    'plutocracy': ['P', 'L', 'UW0', 'T', 'AA1', 'K', 'R', 'AH0', 'S', 'IY0'],
    'polemize': ['P', 'AA1', 'L', 'AH0', 'M', 'AY2', 'Z'],
    'polemogenic': ['P', 'AH0', 'L', 'EH2', 'M', 'AH0', 'JH', 'EH1', 'N', 'IH0', 'K'],
    'polemology': ['P', 'AA2', 'L', 'AH0', 'M', 'AA1', 'L', 'AH0', 'JH', 'IY0'],
    'postbellum': ['P', 'OW2', 'S', 'T', 'B', 'EH1', 'L', 'AH0', 'M'],
    'presentiment': ['P', 'R', 'IH0', 'Z', 'EH1', 'N', 'T', 'AH0', 'M', 'AH0', 'N', 'T'],
    'pulsate': ['P', 'AH1', 'L', 'S', 'EY2', 'T'],
    'pyromania': ['P', 'AY2', 'R', 'OW0', 'M', 'EY1', 'N', 'IY0', 'AH0'],
    'recumbent': ['R', 'IH0', 'K', 'AH1', 'M', 'B', 'AH0', 'N', 'T'],
    'repugnance': ['R', 'IH0', 'P', 'AH1', 'G', 'N', 'AH0', 'N', 'S'],
    'sagacious': ['S', 'AH0', 'G', 'EY1', 'SH', 'AH0', 'S'],
    'sapient': ['S', 'EY1', 'P', 'IY0', 'AH0', 'N', 'T'],
    'sciolist': ['S', 'AY1', 'AH0', 'L', 'IH0', 'S', 'T'],
    'sentient': ['S', 'EH1', 'N', 'SH', 'AH0', 'N', 'T'],
    'solecism': ['S', 'AA1', 'L', 'AH0', 'S', 'IH2', 'Z', 'AH0', 'M'],
    'strophic': ['S', 'T', 'R', 'OW1', 'F', 'IH0', 'K'],
    'supervene': ['S', 'UW2', 'P', 'ER0', 'V', 'IY1', 'N'],
    'tachygraphy': ['T', 'AH0', 'K', 'IH1', 'G', 'R', 'AH0', 'F', 'IY0'],
    'tachyon': ['T', 'AE1', 'K', 'IY0', 'AA2', 'N'],
    'tachyphylaxis': ['T', 'AE2', 'K', 'IH0', 'F', 'AH0', 'L', 'AE1', 'K', 'S', 'IH0', 'S'],
    'tachistoscope': ['T', 'AH0', 'K', 'IH1', 'S', 'T', 'AH0', 'S', 'K', 'OW2', 'P'],
    'tachometer': ['T', 'AE0', 'K', 'AA1', 'M', 'AH0', 'T', 'ER0'],
    'tachytelic': ['T', 'AE2', 'K', 'IH0', 'T', 'EH1', 'L', 'IH0', 'K'],
    'telekinesis': ['T', 'EH2', 'L', 'AH0', 'K', 'IH0', 'N', 'IY1', 'S', 'IH0', 'S'],
    'theosophy': ['TH', 'IY0', 'AA1', 'S', 'AH0', 'F', 'IY0'],
    'transmute': ['T', 'R', 'AE0', 'N', 'Z', 'M', 'Y', 'UW1', 'T'],
    'umbral': ['AH1', 'M', 'B', 'R', 'AH0', 'L'],
    'umbriferous': ['AH0', 'M', 'B', 'R', 'IH1', 'F', 'ER0', 'AH0', 'S'],
    'valediction': ['V', 'AE2', 'L', 'AH0', 'D', 'IH1', 'K', 'SH', 'AH0', 'N'],
}


def is_vowel(phoneme: str) -> bool:
    return phoneme.rstrip('012') in VOWELS


def normalize_arpabet(phones: list[str]) -> list[str]:
    """Normalize ARPAbet sequences before syllabification."""
    # Split ER0 before a vowel into AH0 + R so R acts as onset of next syllable
    # (e.g. algorithm: AL-guh-rith-uhm, corroborate: kuh-RAHB-uh-rayt)
    out: list[str] = []
    for i, p in enumerate(phones):
        if p == 'ER0' and i + 1 < len(phones) and is_vowel(phones[i + 1]):
            out.append('AH0')
            out.append('R')
        else:
            out.append(p)
    return out


def ipa_to_arpabet(ipa_str: str) -> list[str]:
    """Convert an IPA pronunciation string into an ARPAbet phoneme list."""
    s = ipa_str.strip().strip('/').replace(' ', '')
    tokens: list[str] = []
    i = 0
    current_stress = '0'

    vowel_map = {
        'æ': 'AE',
        'ɛ': 'EH',
        'e': 'EH',
        'ɪ': 'IH',
        'i': 'IY',
        'ɒ': 'AA',
        'ɑ': 'AA',
        'ɔ': 'AO',
        'ʊ': 'UH',
        'u': 'UW',
        'ʌ': 'AH',
        'ə': 'AH',
        'ɜ': 'ER',
        'a': 'AA',
        'o': 'OW',
    }
    cons_map = {
        'p': 'P', 'b': 'B', 't': 'T', 'd': 'D', 'k': 'K', 'ɡ': 'G', 'g': 'G',
        'f': 'F', 'v': 'V', 'θ': 'TH', 'ð': 'DH', 's': 'S', 'z': 'Z',
        'ʃ': 'SH', 'ʒ': 'ZH', 'h': 'HH', 'm': 'M', 'n': 'N', 'ŋ': 'NG',
        'l': 'L', 'r': 'R', 'w': 'W', 'j': 'Y',
    }

    while i < len(s):
        ch = s[i]
        if ch == 'ˈ':
            current_stress = '1'
            i += 1
            continue
        if ch == 'ˌ':
            current_stress = '2'
            i += 1
            continue
        if ch in '.ː-':
            i += 1
            continue

        two = s[i:i + 2]
        three = s[i:i + 3]

        if three in ('ɛər', 'eər'):
            tokens.extend(['EH' + current_stress, 'R'])
            current_stress = '0'
            i += 3
            continue
        if three == 'ʊər':
            tokens.extend(['UH' + current_stress, 'R'])
            current_stress = '0'
            i += 3
            continue
        if three == 'ɪər':
            tokens.extend(['IH' + current_stress, 'R'])
            current_stress = '0'
            i += 3
            continue

        if two == 'tʃ':
            tokens.append('CH')
            i += 2
            continue
        if two == 'dʒ':
            tokens.append('JH')
            i += 2
            continue

        if two in ('ɜː', 'ɜr'):
            stress_val = '2' if current_stress == '0' else current_stress
            tokens.append('ER' + stress_val)
            current_stress = '0'
            i += 3 if s[i:i + 3] == 'ɜːr' else 2
            continue

        if two in ('ɑː', 'ɑr'):
            if s[i:i + 3] == 'ɑːr':
                tokens.extend(['AA' + current_stress, 'R'])
                i += 3
            else:
                tokens.append('AA' + current_stress)
                i += 2
            current_stress = '0'
            continue

        if two == 'ɔː':
            tokens.append('AO' + current_stress)
            current_stress = '0'
            i += 2
            continue
        if two == 'iː':
            tokens.append('IY' + current_stress)
            current_stress = '0'
            i += 2
            continue
        if two == 'uː':
            tokens.append('UW' + current_stress)
            current_stress = '0'
            i += 2
            continue
        if two == 'eɪ':
            tokens.append('EY' + current_stress)
            current_stress = '0'
            i += 2
            continue
        if two == 'aɪ':
            tokens.append('AY' + current_stress)
            current_stress = '0'
            i += 2
            continue
        if two == 'ɔɪ':
            tokens.append('OY' + current_stress)
            current_stress = '0'
            i += 2
            continue
        if two in ('oʊ', 'əʊ'):
            tokens.append('OW' + current_stress)
            current_stress = '0'
            i += 2
            continue
        if two == 'aʊ':
            tokens.append('AW' + current_stress)
            current_stress = '0'
            i += 2
            continue

        if ch in vowel_map:
            # Preserve stressed/full quality of /ʌ/ even without primary stress mark
            stress_val = '2' if (ch == 'ʌ' and current_stress == '0') else current_stress
            tokens.append(vowel_map[ch] + stress_val)
            current_stress = '0'
            i += 1
            continue

        if ch in cons_map:
            tokens.append(cons_map[ch])
            i += 1
            continue

        raise ValueError(f"Unsupported IPA character {ch!r} in {ipa_str!r}")

    # Insert schwa before syllabic L/N
    fixed: list[str] = []
    for idx, tok in enumerate(tokens):
        if tok in ('L', 'N') and idx > 0 and not is_vowel(tokens[idx - 1]):
            next_is_v = (idx + 1 < len(tokens)) and is_vowel(tokens[idx + 1])
            if not next_is_v and tokens[idx - 1] not in ('R', 'L', 'M', 'N', 'NG'):
                fixed.append('AH0')
            elif tok == 'L' and not next_is_v and tokens[idx - 1] in ('M', 'N'):
                fixed.append('AH0')
        fixed.append(tok)

    if not any(t.endswith('1') for t in fixed):
        for idx, t in enumerate(fixed):
            if is_vowel(t):
                fixed[idx] = t[:-1] + '1'
                break

    # Normalize /t j uː/ and /d j uː/ to American /t uː/, /d uː/
    americanized: list[str] = []
    j = 0
    while j < len(fixed):
        if (
            j + 2 < len(fixed)
            and fixed[j] in ('T', 'D')
            and fixed[j + 1] == 'Y'
            and fixed[j + 2].startswith('UW')
        ):
            americanized.append(fixed[j])
            americanized.append(fixed[j + 2])
            j += 3
            continue
        americanized.append(fixed[j])
        j += 1

    # Collapse unstressed AH0 + R before consonant/end into ER0
    collapsed: list[str] = []
    j = 0
    while j < len(americanized):
        if j + 1 < len(americanized) and americanized[j] == 'AH0' and americanized[j + 1] == 'R':
            next_is_v = (j + 2 < len(americanized)) and is_vowel(americanized[j + 2])
            if not next_is_v:
                collapsed.append('ER0')
                j += 2
                continue
        collapsed.append(americanized[j])
        j += 1

    return collapsed


def syllabify(phones: list[str]) -> list[tuple[list[str], str, list[str]]]:
    """Split an ARPAbet phoneme list into (onset, vowel, coda) syllables."""
    phones = normalize_arpabet(phones)
    v_indices = [i for i, p in enumerate(phones) if is_vowel(p)]
    if not v_indices:
        return [([], '', phones)]

    onsets: list[list[str]] = [phones[:v_indices[0]]]
    codas: list[list[str]] = []

    for idx in range(len(v_indices) - 1):
        v1_i = v_indices[idx]
        v2_i = v_indices[idx + 1]
        v1 = phones[v1_i]
        v1_base = v1.rstrip('012')
        v1_stress = v1[-1] if v1[-1].isdigit() else '0'
        cluster = phones[v1_i + 1 : v2_i]

        split = len(cluster)
        if len(cluster) >= 3 and tuple(cluster[-3:]) in ONSETS_3:
            split = len(cluster) - 3
        elif len(cluster) >= 2 and tuple(cluster[-2:]) in ONSETS_2:
            split = len(cluster) - 2
        elif len(cluster) >= 1 and cluster[-1] != 'NG':
            split = len(cluster) - 1

        coda = cluster[:split]
        onset = cluster[split:]

        # Keep stressed short vowels in closed syllables when followed by consonants
        # so students read the short vowel unambiguously (e.g. KAP-tih-vayt, KAS-tuh-gayt).
        if not coda and v1_stress != '0' and len(onset) == 1:
            c = onset[0]
            if c == 'R' and v1_base in ('AE', 'EH', 'IH', 'AA', 'AO', 'UH'):
                coda = [c]
                onset = []
            elif v1_base in SHORT_VOWELS and c not in ('Y', 'W', 'HH', 'NG'):
                coda = [c]
                onset = []
        elif not coda and v1_stress != '0' and len(onset) >= 2 and v1_base in SHORT_VOWELS:
            coda = [onset[0]]
            onset = onset[1:]
        elif not coda and v1 == 'AH0' and len(onset) == 2 and onset[0] == 'S' and onset[1] in ('N', 'M', 'L', 'W'):
            # Keep '-ousness' / '-ous-ly' boundaries clean (e.g. lih-TIJ-uhs-nis)
            coda = ['S']
            onset = onset[1:]

        codas.append(coda)
        onsets.append(onset)

    codas.append(phones[v_indices[-1] + 1 :])

    return [(onsets[i], phones[vi], codas[i]) for i, vi in enumerate(v_indices)]


def _render_cons(clist: list[str]) -> str:
    return ''.join(CONS_MAP[c] for c in clist)


def arpabet_to_respelling(phones: list[str]) -> str:
    """Convert ARPAbet phonemes to student-friendly phonetic respelling."""
    syls = syllabify(phones)
    parts: list[str] = []
    has_primary = any(v.endswith('1') for _, v, _ in syls)

    for idx, (onset, v, coda) in enumerate(syls):
        v_base = v.rstrip('012')
        stress = v[-1] if v[-1].isdigit() else '0'
        if not has_primary and idx == 0:
            stress = '1'

        r_coda = bool(coda and coda[0] == 'R')
        rem_coda = coda[1:] if r_coda else coda

        v_str: str | None = None
        if r_coda:
            r_vowel_map = {
                'AE': 'air',
                'EH': 'air',
                'IH': 'eer',
                'AA': 'ahr',
                'AO': 'or',
                'UH': 'oor',
            }
            if v_base in r_vowel_map:
                v_str = r_vowel_map[v_base]
            else:
                r_coda = False
                rem_coda = coda

        if v_str is None:
            is_open = len(coda) == 0
            if v_base == 'IY':
                v_str = 'ee'
            elif v_base == 'IH':
                v_str = 'ih' if is_open else 'i'
            elif v_base == 'EY':
                v_str = 'ay'
            elif v_base == 'EH':
                v_str = 'eh' if is_open else 'e'
            elif v_base == 'AE':
                v_str = 'a' if not is_open else ('uh' if stress == '0' else 'a')
            elif v_base == 'AA':
                v_str = 'ah'
            elif v_base == 'AO':
                v_str = 'aw'
            elif v_base == 'OW':
                v_str = 'oh'
            elif v_base == 'UH':
                if onset == ['F'] and stress == '0':
                    v_str = 'uh'
                elif onset and onset[-1] in ('Y', 'JH') and stress == '0':
                    v_str = 'oo'
                else:
                    v_str = 'uu'
            elif v_base == 'UW':
                v_str = 'oo'
            elif v_base == 'AH':
                if stress == '0':
                    v_str = 'uh'
                else:
                    v_str = 'uh' if is_open else 'u'
            elif v_base == 'ER':
                v_str = 'er' if stress == '0' else 'ur'
            elif v_base == 'AW':
                v_str = 'ow'
            elif v_base == 'OY':
                v_str = 'oy'
            elif v_base == 'AY':
                v_str = 'eye' if not onset else 'y'
            else:
                v_str = v_base.lower()

        syl_str = f"{_render_cons(onset)}{v_str}{_render_cons(rem_coda)}"
        if stress == '1':
            syl_str = syl_str.upper()
        parts.append(syl_str)

    return '-'.join(parts)


def get_cmu_dict() -> dict[str, list[list[str]]]:
    try:
        import cmudict
        return cmudict.dict()
    except ImportError:
        return {}


def is_ipa_pronunciation(value: str) -> bool:
    """Return True if a stored pronunciation string looks like IPA rather than respelling."""
    if not value:
        return False
    return bool(re.search(r'[/ˈˌæɑɒɔəɛɜɡɪʃʊʌʒθðŋː]', value))


def word_to_respelling(
    word: str,
    existing_pronunciation: str = '',
    cmu_dict: dict[str, list[list[str]]] | None = None,
) -> str:
    """Resolve a word into a student-friendly phonetic respelling."""
    clean = word.lower().strip()
    if clean in ARPABET_OVERRIDES:
        return arpabet_to_respelling(ARPABET_OVERRIDES[clean])

    if cmu_dict is None:
        cmu_dict = get_cmu_dict()

    if clean in cmu_dict:
        return arpabet_to_respelling(cmu_dict[clean][0])

    if existing_pronunciation and is_ipa_pronunciation(existing_pronunciation):
        return arpabet_to_respelling(ipa_to_arpabet(existing_pronunciation))

    if '-' in clean:
        sub_parts = [
            word_to_respelling(part, '', cmu_dict)
            for part in clean.split('-')
            if part
        ]
        if all(sub_parts):
            return '-'.join(sub_parts)

    raise LookupError(f"No pronunciation source found for word {word!r}")
