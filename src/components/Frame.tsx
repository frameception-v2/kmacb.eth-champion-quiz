"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { PurpleButton } from "~/components/ui/PurpleButton";

import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE, QUIZ_QUESTIONS, RESULT_MESSAGES } from "~/lib/constants";

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (selectedAnswer: number) => {
    const isCorrect = QUIZ_QUESTIONS[currentQuestion].correct === selectedAnswer;
    setUserAnswers([...userAnswers, selectedAnswer]);
    setScore(prev => prev + (isCorrect ? 1 : 0));

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers([]);
    setScore(0);
    setShowResult(false);
  };

  const getResultMessage = () => {
    if (score === QUIZ_QUESTIONS.length) return RESULT_MESSAGES[2];
    if (score >= QUIZ_QUESTIONS.length / 2) return RESULT_MESSAGES[1];
    return RESULT_MESSAGES[0];
  };

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) return;

      setContext(context);
      sdk.actions.ready({});
      setIsSDKLoaded(true);
    };

    if (sdk && !isSDKLoaded) {
      load();
      return () => sdk.removeAllListeners();
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) return <div>Loading...</div>;

  return (
    <div style={{
      paddingTop: context?.client.safeAreaInsets?.top ?? 0,
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
      paddingRight: context?.client.safeAreaInsets?.right ?? 0,
    }}>
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-neutral-900">
          {PROJECT_TITLE}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {showResult ? "Quiz Results" : `Question ${currentQuestion + 1}/${QUIZ_QUESTIONS.length}`}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!showResult ? (
              <>
                <p className="mb-4 font-medium">
                  {QUIZ_QUESTIONS[currentQuestion].question}
                </p>
                <div className="space-y-2">
                  {QUIZ_QUESTIONS[currentQuestion].answers.map((answer, index) => (
                    <PurpleButton
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className="w-full text-sm"
                    >
                      {answer}
                    </PurpleButton>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Score: {score} correct
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 font-medium">{getResultMessage()}</p>
                <div className="mb-4">
                  Final Score: {score}/{QUIZ_QUESTIONS.length}
                </div>
                <PurpleButton
                  onClick={resetQuiz}
                  className="w-full"
                >
                  Try Again
                </PurpleButton>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
