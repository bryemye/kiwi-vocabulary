from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Root, VocabularyWord, ReadingPassage, Question, StudyLog


class Command(BaseCommand):
    help = 'Seeds initial SAT/ACT prep data for roots, vocabulary, math, and reading'

    def handle(self, *args, **options):
        self.stdout.write("Seeding SAT/ACT prep database...")

        # 0. Create default demo student
        demo_user, _ = User.objects.get_or_create(
            username='demo_student',
            defaults={
                'first_name': 'SAT',
                'last_name': 'Scholar',
                'email': 'scholar@example.com'
            }
        )
        if not demo_user.has_usable_password():
            demo_user.set_password('satprep123')
            demo_user.save()

        # 1. Clear existing seed data safely if needed
        # We can update_or_create to make it idempotent
        
        # ROOT DATA: 9 Roots (Latin & Greek)
        roots_data = [
            {
                "morpheme": "loqu / loc",
                "language": "Latin",
                "core_meaning": "to speak / talk",
                "mnemonic": "Loquacious parrots lock into speaking all day.",
                "words": [
                    {
                        "word": "circumlocution",
                        "prefix": "circum- (around)",
                        "suffix": "-tion (state of)",
                        "definition": "The use of many words where fewer would do, especially in a deliberate attempt to be vague, evasive, or ambiguous.",
                        "sat_sentence": "The spokesperson's circumlocution baffled reporters who were demanding a straightforward update on the budget deficit.",
                        "connotation": "negative",
                        "pronunciation": "sir-kuhm-loh-KYOO-shun",
                        "part_of_speech": "noun"
                    },
                    {
                        "word": "colloquial",
                        "prefix": "col- (together)",
                        "suffix": "-ial (pertaining to)",
                        "definition": "Used in ordinary or familiar conversation; informal, conversational, not literary.",
                        "sat_sentence": "While colloquial vernacular thrives in dialogue, formal essays require precise analytical terminology.",
                        "connotation": "neutral",
                        "pronunciation": "kuh-LOH-kwee-uhl",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "eloquent",
                        "prefix": "e- (out)",
                        "suffix": "-ent (inclined to)",
                        "definition": "Fluent, persuasive, and vividly expressive in speaking or writing.",
                        "sat_sentence": "Her eloquent defense of civil liberties moved the Supreme Court justices and swayed the landmark decision.",
                        "connotation": "positive",
                        "pronunciation": "EH-luh-kwuhnt",
                        "part_of_speech": "adjective"
                    }
                ]
            },
            {
                "morpheme": "spec / spic",
                "language": "Latin",
                "core_meaning": "to look / see",
                "mnemonic": "Spectacles allow you to inspect and clearly see details.",
                "words": [
                    {
                        "word": "conspicuous",
                        "prefix": "con- (thoroughly)",
                        "suffix": "-uous (characterized by)",
                        "definition": "Standing out so as to be clearly visible; attracting prominent notice or attention.",
                        "sat_sentence": "The neon signage was conspicuous even amidst the dense midnight fog covering the downtown thoroughfare.",
                        "connotation": "neutral",
                        "pronunciation": "kuhn-SPIK-yoo-uhs",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "circumspect",
                        "prefix": "circum- (around)",
                        "suffix": "",
                        "definition": "Wary and unwilling to take uncalculated risks; prudent, watchful, and discreet.",
                        "sat_sentence": "Given the volatility of the global commodities market, the treasury secretary urged a circumspect investment posture.",
                        "connotation": "positive",
                        "pronunciation": "SIR-kuhm-spekt",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "perspicacious",
                        "prefix": "per- (through)",
                        "suffix": "-acious (abounding in)",
                        "definition": "Having a ready insight into and clear understanding of complex things; shrewd and perceptive.",
                        "sat_sentence": "The perspicacious detective noticed tiny disparities in the timeline that others had dismissed as irrelevant.",
                        "connotation": "positive",
                        "pronunciation": "pur-spih-KAY-shuhs",
                        "part_of_speech": "adjective"
                    }
                ]
            },
            {
                "morpheme": "chron",
                "language": "Greek",
                "core_meaning": "time",
                "mnemonic": "Chronometers synchronize and measure running time accurately.",
                "words": [
                    {
                        "word": "anachronism",
                        "prefix": "ana- (against/backward)",
                        "suffix": "-ism (belief/condition)",
                        "definition": "A thing belonging or appropriate to a period other than that in which it exists, especially a chronological incongruity.",
                        "sat_sentence": "The appearance of a digital wristwatch in the 17th-century period drama was an unmistakable anachronism.",
                        "connotation": "neutral",
                        "pronunciation": "uh-NAK-ruh-niz-uhm",
                        "part_of_speech": "noun"
                    },
                    {
                        "word": "synchronous",
                        "prefix": "syn- (together)",
                        "suffix": "-ous (full of)",
                        "definition": "Existing or occurring at the exact same moment; having coincident periods.",
                        "sat_sentence": "The satellites maintained synchronous orbit to ensure uninterrupted communication links across continents.",
                        "connotation": "neutral",
                        "pronunciation": "SING-kruh-nuhs",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "chronic",
                        "prefix": "",
                        "suffix": "-ic (relating to)",
                        "definition": "Persisting for an extensive duration or constantly recurring; habitual.",
                        "sat_sentence": "Chronic delays on the transit line spurred widespread resident demands for automated track switching.",
                        "connotation": "negative",
                        "pronunciation": "KRAH-nik",
                        "part_of_speech": "adjective"
                    }
                ]
            },
            {
                "morpheme": "bell / belli",
                "language": "Latin",
                "core_meaning": "war / hostility",
                "mnemonic": "Belligerent gladiators bell the drum for open war.",
                "words": [
                    {
                        "word": "belligerent",
                        "prefix": "",
                        "suffix": "-ent (causing)",
                        "definition": "Hostile, aggressive, and combative; engaged in open warfare or dispute.",
                        "sat_sentence": "His belligerent demeanor during treaty negotiations threatened to derail months of diplomatic headway.",
                        "connotation": "negative",
                        "pronunciation": "buh-LIJ-er-uhnt",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "antebellum",
                        "prefix": "ante- (before)",
                        "suffix": "-um (noun ending)",
                        "definition": "Occurring or existing before a particular war, especially the American Civil War.",
                        "sat_sentence": "The museum featured an exhibit comparing antebellum southern commerce with post-reconstruction industry.",
                        "connotation": "neutral",
                        "pronunciation": "an-tee-BEL-uhm",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "bellicose",
                        "prefix": "",
                        "suffix": "-ose (full of)",
                        "definition": "Demonstrating overt aggression, warmongering, or eagerness to fight.",
                        "sat_sentence": "The editorial warned against adopting a bellicose foreign policy when de-escalation remained viable.",
                        "connotation": "negative",
                        "pronunciation": "BEL-ih-kohs",
                        "part_of_speech": "adjective"
                    }
                ]
            },
            {
                "morpheme": "path / pathy",
                "language": "Greek",
                "core_meaning": "feeling / suffering",
                "mnemonic": "Feeling deep empathy walks along another's sorrowful path.",
                "words": [
                    {
                        "word": "apathy",
                        "prefix": "a- (without)",
                        "suffix": "-y (condition)",
                        "definition": "Lack of enthusiasm, concern, or emotion; complete indifference.",
                        "sat_sentence": "Widespread civic apathy resulted in historic lows for voter turnout during the off-year municipal elections.",
                        "connotation": "negative",
                        "pronunciation": "AP-uh-thee",
                        "part_of_speech": "noun"
                    },
                    {
                        "word": "empathy",
                        "prefix": "em- (in/within)",
                        "suffix": "-y (condition)",
                        "definition": "The psychological capacity to understand and intimately share the emotions and experiences of another.",
                        "sat_sentence": "Great narrative literature fosters genuine empathy by placing readers inside the minds of unfamiliar protagonists.",
                        "connotation": "positive",
                        "pronunciation": "EM-puh-thee",
                        "part_of_speech": "noun"
                    },
                    {
                        "word": "antipathy",
                        "prefix": "anti- (against)",
                        "suffix": "-y (condition)",
                        "definition": "A deep-seated, persistent feeling of aversion, hatred, or intense dislike.",
                        "sat_sentence": "Despite cordial greetings at dinner, there was unmistakable antipathy between the two political rivals.",
                        "connotation": "negative",
                        "pronunciation": "an-TIP-uh-thee",
                        "part_of_speech": "noun"
                    }
                ]
            },
            {
                "morpheme": "luc / lum",
                "language": "Latin",
                "core_meaning": "light / clear",
                "mnemonic": "Luminous lanterns illuminate the dark with lucid clarity.",
                "words": [
                    {
                        "word": "lucid",
                        "prefix": "",
                        "suffix": "-id (state of)",
                        "definition": "Expressed with transparent clarity; easy to understand; fully rational and intelligible.",
                        "sat_sentence": "The mathematician provided a remarkably lucid overview of topology that captivated even first-year students.",
                        "connotation": "positive",
                        "pronunciation": "LOO-sid",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "elucidate",
                        "prefix": "e- (out)",
                        "suffix": "-ate (make)",
                        "definition": "To make something lucid, clear, and comprehensible; to thoroughly explain.",
                        "sat_sentence": "Dr. Vance utilized confocal microscopy slides to elucidate how neurotransmitters travel across synaptic gaps.",
                        "connotation": "positive",
                        "pronunciation": "ih-LOO-sih-dayt",
                        "part_of_speech": "verb"
                    },
                    {
                        "word": "pellucid",
                        "prefix": "pel- (through/thorough)",
                        "suffix": "-id (state of)",
                        "definition": "Translucently clear; crystalline; remarkably plain to comprehend.",
                        "sat_sentence": "The high alpine lake possessed pellucid waters that revealed every stone twenty feet beneath the surface.",
                        "connotation": "positive",
                        "pronunciation": "peh-LOO-sid",
                        "part_of_speech": "adjective"
                    }
                ]
            },
            {
                "morpheme": "mal",
                "language": "Latin",
                "core_meaning": "bad / ill / evil",
                "mnemonic": "Malfunctioning systems produce malicious errors.",
                "words": [
                    {
                        "word": "malevolent",
                        "prefix": "male- (bad)",
                        "suffix": "-ent (doing)",
                        "definition": "Having or exhibiting ill will; wishing harm or malice upon others.",
                        "sat_sentence": "The villain's malevolent intentions were concealed behind a courteous smile and counterfeit promises.",
                        "connotation": "negative",
                        "pronunciation": "muh-LEV-uh-luhnt",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "malignant",
                        "prefix": "mal- (bad)",
                        "suffix": "-ant (state)",
                        "definition": "Extremely harmful, hostile, or virulent; tending to produce deterioration or death.",
                        "sat_sentence": "The unchecked spread of misinformation exerted a malignant influence on community trust.",
                        "connotation": "negative",
                        "pronunciation": "muh-LIG-nuhnt",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "maladroit",
                        "prefix": "mal- (bad)",
                        "suffix": "-adroit (dexterous)",
                        "definition": "Lacking skill, tact, or grace; clumsy and inept in handling situations.",
                        "sat_sentence": "His maladroit attempt to smooth over the conflict only offended both disputing factions further.",
                        "connotation": "negative",
                        "pronunciation": "mal-uh-DROYT",
                        "part_of_speech": "adjective"
                    }
                ]
            },
            {
                "morpheme": "bene / bon",
                "language": "Latin",
                "core_meaning": "good / well",
                "mnemonic": "A benevolent benefactor blesses everyone with beneficial goodness.",
                "words": [
                    {
                        "word": "beneficent",
                        "prefix": "bene- (well)",
                        "suffix": "-ent (doing)",
                        "definition": "Performing acts of kindness or charity; actively doing good.",
                        "sat_sentence": "The company's beneficent patronage sustained the city youth symphony through times of austerity.",
                        "connotation": "positive",
                        "pronunciation": "buh-NEF-ih-suhnt",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "benevolent",
                        "prefix": "bene- (well)",
                        "suffix": "-ent (wishing)",
                        "definition": "Well-meaning, kindly, and motivated by a desire to promote general human welfare.",
                        "sat_sentence": "Her benevolent guidance inspired countless underprivileged teenagers to pursue careers in engineering.",
                        "connotation": "positive",
                        "pronunciation": "buh-NEV-uh-luhnt",
                        "part_of_speech": "adjective"
                    },
                    {
                        "word": "benign",
                        "prefix": "ben- (good)",
                        "suffix": "",
                        "definition": "Gentle, mild, and favorable; having no destructive or adverse consequence.",
                        "sat_sentence": "The unseasonably benign weather allowed maritime crews to complete harbour renovations ahead of schedule.",
                        "connotation": "positive",
                        "pronunciation": "bih-NYNE",
                        "part_of_speech": "adjective"
                    }
                ]
            },
            {
                "morpheme": "phil",
                "language": "Greek",
                "core_meaning": "love / fondness",
                "mnemonic": "Philanthropists exhibit loving generosity toward humanity.",
                "words": [
                    {
                        "word": "philanthropy",
                        "prefix": "phil- (love)",
                        "suffix": "-y (practice of)",
                        "definition": "The desire to promote the welfare of others, expressed especially through charitable donation.",
                        "sat_sentence": "Through strategic philanthropy, the tech magnate established endowed chairs in genomic medicine.",
                        "connotation": "positive",
                        "pronunciation": "fih-LAN-thruh-pee",
                        "part_of_speech": "noun"
                    },
                    {
                        "word": "bibliophile",
                        "prefix": "biblio- (book)",
                        "suffix": "-phile (lover)",
                        "definition": "A person who loves, admires, or collects books passionately.",
                        "sat_sentence": "As an avid bibliophile, he spent weekends scouring dusty antiquarian bookshops for first editions.",
                        "connotation": "positive",
                        "pronunciation": "BIB-lee-uh-fyl",
                        "part_of_speech": "noun"
                    },
                    {
                        "word": "philosophical",
                        "prefix": "philo- (love of)",
                        "suffix": "-ical (pertaining to)",
                        "definition": "Having or showing a calm, rational, and reflective attitude when facing adversity.",
                        "sat_sentence": "Faced with the unexpected software malfunction, the lead developer maintained a philosophical calm.",
                        "connotation": "neutral",
                        "pronunciation": "fil-uh-SOF-ih-kuhl",
                        "part_of_speech": "adjective"
                    }
                ]
            }
        ]

        created_roots_count = 0
        created_words_count = 0
        created_words = []

        for r_item in roots_data:
            root_obj, _ = Root.objects.update_or_create(
                morpheme=r_item["morpheme"],
                defaults={
                    "language": r_item["language"],
                    "core_meaning": r_item["core_meaning"],
                    "mnemonic": r_item["mnemonic"]
                }
            )
            created_roots_count += 1
            for w_item in r_item["words"]:
                word_obj, _ = VocabularyWord.objects.update_or_create(
                    word=w_item["word"],
                    defaults={
                        "root": root_obj,
                        "prefix": w_item["prefix"],
                        "suffix": w_item["suffix"],
                        "definition": w_item["definition"],
                        "sat_sentence": w_item["sat_sentence"],
                        "connotation": w_item["connotation"],
                        "pronunciation": w_item["pronunciation"],
                        "part_of_speech": w_item["part_of_speech"],
                    }
                )
                created_words_count += 1
                created_words.append(word_obj)

        self.stdout.write(f"Created/updated {created_roots_count} roots and {created_words_count} vocabulary words.")

        # 2. MATH QUESTIONS WITH COORDINATE / FUNCTION CONFIGS
        math_questions = [
            {
                "section": "MATH",
                "prompt": "The quadratic function f(x) = (x - 2)² - 4 is plotted on the coordinate plane below. What are the coordinates of the vertex (minimum point) of this parabola?",
                "graph_config": {
                    "type": "function",
                    "fn": "(x - 2)**2 - 4",
                    "displayEquation": "f(x) = (x - 2)² - 4",
                    "domain": [-4, 8],
                    "range": [-6, 10],
                    "keyPoints": [
                        {"x": 2, "y": -4, "label": "Vertex (2, -4)", "color": "#10b981"},
                        {"x": 0, "y": 0, "label": "(0, 0)", "color": "#6366f1"},
                        {"x": 4, "y": 0, "label": "(4, 0)", "color": "#6366f1"}
                    ],
                    "gridStep": 1,
                    "color": "#3b82f6"
                },
                "choices": {
                    "A": "(2, -4)",
                    "B": "(-2, -4)",
                    "C": "(2, 4)",
                    "D": "(-2, 4)"
                },
                "correct_answer": "A",
                "explanation": "The standard vertex form of a quadratic equation is f(x) = a(x - h)² + k, where (h, k) represents the coordinates of the vertex. In f(x) = (x - 2)² - 4, h = 2 and k = -4. Because a = 1 > 0, the parabola opens upward and reaches its minimum at the vertex (2, -4)."
            },
            {
                "section": "MATH",
                "prompt": "Line L is defined by the linear relation y = -0.5x + 3. Which point represents the y-intercept of Line L, and what is its slope?",
                "graph_config": {
                    "type": "function",
                    "fn": "-0.5 * x + 3",
                    "displayEquation": "Line L: y = -0.5x + 3",
                    "domain": [-6, 10],
                    "range": [-2, 8],
                    "keyPoints": [
                        {"x": 0, "y": 3, "label": "y-intercept (0, 3)", "color": "#f59e0b"},
                        {"x": 6, "y": 0, "label": "x-intercept (6, 0)", "color": "#6366f1"}
                    ],
                    "gridStep": 1,
                    "color": "#ef4444"
                },
                "choices": {
                    "A": "y-intercept at (0, -0.5) with slope 3",
                    "B": "y-intercept at (3, 0) with slope -0.5",
                    "C": "y-intercept at (0, 3) with slope -0.5",
                    "D": "y-intercept at (6, 0) with slope 3"
                },
                "correct_answer": "C",
                "explanation": "In slope-intercept form y = mx + b, m is the slope and (0, b) is the y-intercept. Here, m = -0.5 and b = 3. Substituting x = 0 yields y = -0.5(0) + 3 = 3, verifying the y-intercept is (0, 3) and the slope is -0.5 (falling 1 unit for every 2 units moved to the right)."
            },
            {
                "section": "MATH",
                "prompt": "Two linear functions, y = 2x - 1 and y = -x + 5, are graphed on the coordinate grid. At what coordinate point (x, y) do the two lines intersect?",
                "graph_config": {
                    "type": "system",
                    "displayEquation": "y = 2x - 1  and  y = -x + 5",
                    "domain": [-2, 6],
                    "range": [-3, 9],
                    "lines": [
                        {"fn": "2 * x - 1", "label": "y = 2x - 1", "color": "#2563eb"},
                        {"fn": "-x + 5", "label": "y = -x + 5", "color": "#dc2626"}
                    ],
                    "keyPoints": [
                        {"x": 2, "y": 3, "label": "Intersection (2, 3)", "color": "#10b981"}
                    ],
                    "gridStep": 1
                },
                "choices": {
                    "A": "(1, 1)",
                    "B": "(2, 3)",
                    "C": "(3, 2)",
                    "D": "(2, 5)"
                },
                "correct_answer": "B",
                "explanation": "To find the intersection, equate the two expressions for y: 2x - 1 = -x + 5. Adding x gives 3x - 1 = 5. Adding 1 gives 3x = 6, yielding x = 2. Substitute x = 2 into either equation: y = 2(2) - 1 = 3. Therefore, the lines intersect at point (2, 3)."
            },
            {
                "section": "MATH",
                "prompt": "The absolute value function g(x) = |x - 1| - 3 is graphed below. What are the x-intercepts of g(x)?",
                "graph_config": {
                    "type": "function",
                    "fn": "Math.abs(x - 1) - 3",
                    "displayEquation": "g(x) = |x - 1| - 3",
                    "domain": [-6, 8],
                    "range": [-5, 5],
                    "keyPoints": [
                        {"x": -2, "y": 0, "label": "(-2, 0)", "color": "#8b5cf6"},
                        {"x": 4, "y": 0, "label": "(4, 0)", "color": "#8b5cf6"},
                        {"x": 1, "y": -3, "label": "Vertex (1, -3)", "color": "#ec4899"}
                    ],
                    "gridStep": 1,
                    "color": "#8b5cf6"
                },
                "choices": {
                    "A": "x = -2 and x = 4",
                    "B": "x = -4 and x = 2",
                    "C": "x = -3 and x = 1",
                    "D": "x = 0 and x = 3"
                },
                "correct_answer": "A",
                "explanation": "To solve for the x-intercepts, set g(x) = 0: |x - 1| - 3 = 0, so |x - 1| = 3. This splits into two cases: x - 1 = 3 (giving x = 4) and x - 1 = -3 (giving x = -2). Thus, the x-intercepts occur at x = -2 and x = 4."
            }
        ]

        created_math_questions = []
        for q_data in math_questions:
            q_obj, _ = Question.objects.update_or_create(
                prompt=q_data["prompt"],
                defaults={
                    "section": q_data["section"],
                    "graph_config": q_data["graph_config"],
                    "choices": q_data["choices"],
                    "correct_answer": q_data["correct_answer"],
                    "explanation": q_data["explanation"]
                }
            )
            created_math_questions.append(q_obj)

        self.stdout.write(f"Created/updated {len(created_math_questions)} math questions.")

        # 3. READING PASSAGE AND ASSOCIATED QUESTIONS
        passage_body = (
            "Paragraph 1:\n"
            "For centuries, neuroscientists operated under the dogma that the mature human brain was an immutable organ—a fixed computational machine whose cellular architecture solidified following childhood. Once adult neurons deteriorated through trauma or senescent decay, conventional wisdom held that repair was anatomically impossible. However, modern neuroimaging has dismantled this deterministic model, unveiling a dynamic property known as neuroplasticity: the central nervous system's persistent capacity to structurally reorganize its neural circuitry in response to experiential demands.\n\n"
            "Paragraph 2:\n"
            "At the microscopic scale, plasticity is mediated by synaptic remodeling. When an individual engages in rigorous intellectual training or deliberate cognitive retrieval, specific neural pathways undergo long-term potentiation (LTP). Synapses repeatedly stimulated strengthen their chemical efficacy, while obsolete connections undergo systematic pruning. Far from being a passive receptacle, the cerebral cortex continually recalibrates its functional map, allocating greater cortical representation to faculties exercised with conscious vigilance.\n\n"
            "Paragraph 3:\n"
            "This structural adaptability bears profound ramifications for pedagogical design and standardized testing methodologies. Traditional passive review—such as repeatedly rereading high-yield notes or mechanically highlighting textbook excerpts—induces a deceptive 'illusion of competence.' Students mistake cognitive familiarity with actual mastery. In stark contrast, active retrieval regimens, such as flashcards grounded in morphological breakdown and spaced-repetition drills, impose desirable cognitive difficulties that accelerate hippocampal consolidation.\n\n"
            "Paragraph 4:\n"
            "Critics often assert that neurobiological insights rarely translate cleanly into classroom execution. Skeptics point out that measuring dendritic spine growth in rodent models is a far cry from raising percentile scores on the SAT or ACT. Nonetheless, randomized trials across secondary educational cohorts indicate that students instructed in metacognitive strategies and active recall outpace peers by over a full standard deviation in long-term retention. Far from being an ivory-tower abstraction, plasticity provides empirical foundation for deliberate, disciplined study habits."
        )

        passage_obj, _ = ReadingPassage.objects.update_or_create(
            title="The Architecture of Memory: Neural Plasticity and Cognitive Resilience",
            defaults={
                "author_or_source": "Dr. Evelyn Vance, Journal of Cognitive Neuroscience (2024)",
                "body": passage_body
            }
        )

        reading_questions = [
            {
                "section": "READ",
                "passage": passage_obj,
                "prompt": "Which statement best articulates the primary thesis advanced by Dr. Vance in the passage?",
                "choices": {
                    "A": "Adult neural circuitry is fundamentally fixed, rendering late-stage academic remediation ineffective.",
                    "B": "The human brain's inherent neuroplasticity provides an empirical basis for active learning and spaced retrieval over passive review.",
                    "C": "Standardized tests like the SAT fail to accurately capture structural alterations within the cerebral cortex.",
                    "D": "Synaptic pruning occurs exclusively during childhood and cannot be triggered by adult intellectual study."
                },
                "correct_answer": "B",
                "explanation": "Throughout the passage, Dr. Vance explains that modern neuroimaging disproved the fixed-brain dogma by showing neuroplasticity (Paragraph 1 & 2), and argues that this biological phenomenon validates active retrieval and spaced practice over passive study strategies (Paragraph 3 & 4)."
            },
            {
                "section": "READ",
                "passage": passage_obj,
                "prompt": "As used in Paragraph 3, the phrase 'illusion of competence' most nearly refers to a situation in which a student:",
                "choices": {
                    "A": "Accurately predicts peak academic performance based on previous diagnostic exams.",
                    "B": "Mistakenly assumes familiarity with study material equates to true mastery and recall capability.",
                    "C": "Intentionally fabricates study hours to satisfy parent and teacher expectations.",
                    "D": "Experiences acute anxiety despite possessing comprehensive subject mastery."
                },
                "correct_answer": "B",
                "explanation": "Paragraph 3 explicitly states: 'Students mistake cognitive familiarity with actual mastery' when relying on passive rereading. The author terms this deceptive self-appraisal the 'illusion of competence.'"
            },
            {
                "section": "READ",
                "passage": passage_obj,
                "prompt": "According to the passage, how do active retrieval regimens compare to passive review techniques in fostering cognitive retention?",
                "choices": {
                    "A": "Active retrieval requires less cognitive exertion and produces equivalent hippocampal consolidation.",
                    "B": "Active retrieval imposes desirable cognitive difficulties that accelerate hippocampal consolidation and long-term retention.",
                    "C": "Passive review generates stronger dendritic growth in rodent models than active testing protocols.",
                    "D": "Passive review is superior for immediate recall, whereas active retrieval only aids motor reflexes."
                },
                "correct_answer": "B",
                "explanation": "In Paragraph 3, the text states that active retrieval imposes 'desirable cognitive difficulties that accelerate hippocampal consolidation,' producing retention gains of over a standard deviation compared to passive rereading."
            }
        ]

        created_reading_questions = []
        for rq in reading_questions:
            q_obj, _ = Question.objects.update_or_create(
                prompt=rq["prompt"],
                defaults={
                    "section": rq["section"],
                    "passage": rq["passage"],
                    "choices": rq["choices"],
                    "correct_answer": rq["correct_answer"],
                    "explanation": rq["explanation"],
                    "graph_config": {}
                }
            )
            created_reading_questions.append(q_obj)

        self.stdout.write(f"Created/updated 1 reading passage with {len(created_reading_questions)} questions.")

        # 4. Initial Sample Study Logs so student dashboard is rich and immediately demonstrative
        initial_logs_count = StudyLog.objects.filter(user=demo_user).count()
        if initial_logs_count == 0:
            sample_logs = [
                # Vocab words
                {"item_type": "WORD", "word": created_words[0], "is_correct": True, "seconds_spent": 12},
                {"item_type": "WORD", "word": created_words[1], "is_correct": True, "seconds_spent": 9},
                {"item_type": "WORD", "word": created_words[2], "is_correct": True, "seconds_spent": 15},
                {"item_type": "WORD", "word": created_words[3], "is_correct": True, "seconds_spent": 14},
                {"item_type": "WORD", "word": created_words[4], "is_correct": False, "seconds_spent": 22},
                {"item_type": "WORD", "word": created_words[5], "is_correct": True, "seconds_spent": 18},
                {"item_type": "WORD", "word": created_words[6], "is_correct": True, "seconds_spent": 11},
                {"item_type": "WORD", "word": created_words[7], "is_correct": False, "seconds_spent": 25},
                # Math questions
                {"item_type": "QUESTION", "question": created_math_questions[0], "is_correct": True, "seconds_spent": 45},
                {"item_type": "QUESTION", "question": created_math_questions[1], "is_correct": True, "seconds_spent": 38},
                {"item_type": "QUESTION", "question": created_math_questions[2], "is_correct": False, "seconds_spent": 62},
                # Reading questions
                {"item_type": "QUESTION", "question": created_reading_questions[0], "is_correct": True, "seconds_spent": 75},
                {"item_type": "QUESTION", "question": created_reading_questions[1], "is_correct": True, "seconds_spent": 50},
            ]
            for log_data in sample_logs:
                StudyLog.objects.create(
                    user=demo_user,
                    item_type=log_data["item_type"],
                    word=log_data.get("word"),
                    question=log_data.get("question"),
                    is_correct=log_data["is_correct"],
                    seconds_spent=log_data["seconds_spent"]
                )
            self.stdout.write(f"Seeded {len(sample_logs)} sample study logs for user '{demo_user.username}'.")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
