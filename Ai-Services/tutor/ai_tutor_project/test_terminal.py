"""
test_terminal.py
------------------
Lets you test the whole AI Tutor from the terminal, before FastAPI or
React are wired up. This is a THIN WRAPPER - it calls the exact same
`ai_tutor.answer_question()` / `ai_tutor.translate()` functions that
the FastAPI backend will call. There is no separate implementation.

    python test_terminal.py
"""

from ai_tutor import answer_question, translate

CONVERSATION_ID = "terminal-session"  # one running conversation for this terminal session


def main():
    print("=" * 60)
    print("AI Tutor - terminal test")
    print("Type 'quit' or 'exit' to stop.")
    print("=" * 60)

    while True:
        question = input("\nEnter your question: ").strip()
        if question.lower() in ("quit", "exit"):
            break
        if not question:
            print("Please type a question.")
            continue

        try:
            result = answer_question(question, conversation_id=CONVERSATION_ID)
        except (RuntimeError, ValueError) as e:
            print(f"\nError: {e}")
            continue

        print("\nAnswer:")
        print(result["answer"])

        print("\nSources:")
        if result["sources"]:
            for s in result["sources"]:
                label = f"📄 {s['document']} — Page {s['page']}"
                if s.get("subject"):
                    label += f" ({s['subject']})"
                print(label)
        else:
            print("(none)")

        print("\nLanguage: English")

        lang = input("\nEnter language code to also see it translated (e.g. hi), or press Enter to skip: ").strip()
        if lang and lang.lower() != "en":
            try:
                translated = translate(result["answer"], target_language=lang)
                print(f"\nTranslated ({lang}):")
                print(translated)
            except (RuntimeError, ValueError) as e:
                print(f"\nTranslation error: {e}")


if __name__ == "__main__":
    main()
