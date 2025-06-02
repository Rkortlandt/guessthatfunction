'use server';

/**
 * @fileOverview An AI assistant that answers yes/no questions about rational functions.
 *
 * - answerQuestion - A function that answers the question about the function.
 * - AnswerQuestionInput - The input type for the answerQuestion function.
 * - AnswerQuestionOutput - The return type for the answerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The yes/no question about the function.'),
  functionDescription: z.string().describe('The description of the rational function.'),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z.boolean().describe('The AI agent answer to the question.'),
  reason: z.string().describe('The reasoning behind the answer.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return answerQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are an AI assistant helping Player 2 in a game called Rational Guesser. Player 1 will ask a yes/no question about a rational function. Your task is to answer the question accurately based on the function's description.

Question: {{{question}}}
Function Description: {{{functionDescription}}}

Consider the question and description carefully. Provide your answer and explain the logic behind your answer, and be as accurate as possible.
\nYour answer should be in JSON format:
{
  "answer": true or false,
  "reason": "explanation of your reasoning"
}`,
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
