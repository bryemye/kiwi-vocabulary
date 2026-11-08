import os
import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from kiwi_vocab.models import Root, VocabularyWord
from kiwi_math.models import MathQuestion
from kiwi_reading.models import ReadingPassage, ReadingQuestion

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial SAT/ACT prep data across modular Kiwi Platform apps (kiwi_vocab, kiwi_math, kiwi_reading)'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Kiwi Learning Platform database...")

        # 0. Create default demo student in platform_core
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

        # 1. ROOT DATA: Load from kiwi_vocab/fixtures/sat_vocab_seed.json
        candidate_paths = [
            os.path.join(os.path.dirname(__file__), '..', '..', 'fixtures', 'sat_vocab_seed.json'),
            os.path.join(os.path.dirname(__file__), '..', '..', '..', 'core', 'fixtures', 'sat_vocab_seed.json'),
        ]
        fixture_path = None
        for cp in candidate_paths:
            if os.path.exists(cp):
                fixture_path = cp
                break

        if fixture_path:
            self.stdout.write(f"Loading bulk vocabulary from fixture: {fixture_path}")
            with open(fixture_path, 'r', encoding='utf-8') as f:
                fixture_data = json.load(f)
            roots_data = [
                {
                    "morpheme": entry["root"]["morpheme"],
                    "language": entry["root"]["language"],
                    "core_meaning": entry["root"]["core_meaning"],
                    "mnemonic": entry["root"].get("mnemonic", ""),
                    "thematic_cluster": entry["root"].get("thematic_cluster", "Movement"),
                    "sat_tier": entry["root"].get("sat_tier", "Tier 1 High-Yield"),
                    "words": entry.get("words", [])
                }
                for entry in fixture_data
            ]
        else:
            self.stdout.write(self.style.WARNING("Fixture not found. Using fallback roots."))
            roots_data = []

        created_roots_count = 0
        created_words_count = 0

        for r_item in roots_data:
            root_obj, _ = Root.objects.update_or_create(
                morpheme=r_item["morpheme"],
                defaults={
                    "language": r_item["language"],
                    "core_meaning": r_item["core_meaning"],
                    "mnemonic": r_item["mnemonic"],
                    "thematic_cluster": r_item.get("thematic_cluster", "Movement"),
                    "sat_tier": r_item.get("sat_tier", "Tier 1 High-Yield"),
                }
            )
            created_roots_count += 1
            for w_item in r_item["words"]:
                VocabularyWord.objects.update_or_create(
                    word=w_item["word"].lower().strip(),
                    defaults={
                        "root": root_obj,
                        "prefix": w_item.get("prefix", ""),
                        "suffix": w_item.get("suffix", ""),
                        "definition": w_item["definition"],
                        "sat_sentence": w_item["sat_sentence"],
                        "connotation": w_item.get("connotation", "neutral"),
                        "pronunciation": w_item.get("pronunciation", ""),
                        "part_of_speech": w_item.get("part_of_speech", "adjective"),
                    }
                )
                created_words_count += 1

        self.stdout.write(f"Created/updated {created_roots_count} roots and {created_words_count} vocabulary words in kiwi_vocab.")

        # 2. MATH QUESTIONS IN kiwi_math
        math_questions = [
            {
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
                    "color": "#7BB33B"
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
                    "color": "#7BB33B"
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
                "prompt": "Two linear functions, y = 2x - 1 and y = -x + 5, are graphed on the coordinate grid. At what coordinate point (x, y) do the two lines intersect?",
                "graph_config": {
                    "type": "system",
                    "displayEquation": "y = 2x - 1  and  y = -x + 5",
                    "domain": [-2, 6],
                    "range": [-3, 9],
                    "lines": [
                        {"fn": "2 * x - 1", "label": "y = 2x - 1", "color": "#7BB33B"},
                        {"fn": "-x + 5", "label": "y = -x + 5", "color": "#42281D"}
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
                    "color": "#7BB33B"
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

        created_math = 0
        for q_data in math_questions:
            MathQuestion.objects.update_or_create(
                prompt=q_data["prompt"],
                defaults={
                    "graph_config": q_data["graph_config"],
                    "choices": q_data["choices"],
                    "correct_answer": q_data["correct_answer"],
                    "explanation": q_data["explanation"]
                }
            )
            created_math += 1
        self.stdout.write(f"Created/updated {created_math} math questions in kiwi_math.")

        # 3. READING PASSAGES IN kiwi_reading
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

        created_rq = 0
        for rq in reading_questions:
            ReadingQuestion.objects.update_or_create(
                prompt=rq["prompt"],
                defaults={
                    "passage": rq["passage"],
                    "choices": rq["choices"],
                    "correct_answer": rq["correct_answer"],
                    "explanation": rq["explanation"],
                }
            )
            created_rq += 1
        self.stdout.write(f"Created/updated 1 reading passage with {created_rq} questions in kiwi_reading.")

        self.stdout.write(self.style.SUCCESS("Modular Kiwi Platform seeding completed successfully!"))
