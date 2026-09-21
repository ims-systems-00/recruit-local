import { Request, Response, NextFunction } from "express";
import { AbilityAction } from "@rl/types";
import { AgentAbilityBuilder, AgentConversationAuthZEntity } from "@rl/authz";
import { UnauthorizedException } from "../../../common/helper";
import * as conversationService from "./conversation.service";
import { synthesize } from "./speech.service";

/**
 * `POST /agent/speech` — renders text as audio and streams it back.
 *
 * A plain Express handler rather than `handleController`, which is the only one
 * in the module. That helper always finishes with `res.json`, and this response
 * is an MP3; wrapping binary audio in a JSON envelope would mean base64 in the
 * body, a third more bytes, and a client that has to decode before it can play.
 *
 * Errors still go to `next`, so `globalErrorHandler` formats them exactly as it
 * does for every other route — the response shape only diverges on success.
 *
 * Gated on the same ability as talking to the agent. Read-aloud is a way of
 * consuming the assistant's output, so anyone who may hold a conversation may
 * hear one, and anyone who may not has nothing to read aloud.
 */
export const speak = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ability = new AgentAbilityBuilder(req.session).getAbility();

    if (!ability.can(AbilityAction.Create, AgentConversationAuthZEntity)) {
      throw new UnauthorizedException("You are not authorized to use read-aloud.");
    }

    const { text, voice, speed } = req.body as { text: string; voice?: string; speed?: number };

    // Loaded so an omitted voice or speed falls back to what this user chose
    // rather than to the server default — the whole point of storing them.
    const preferences = await conversationService.accessibilityPreferencesOf(req.session.user._id as string);

    const result = await synthesize({ text, voice, speed, preferences });

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Length", String(result.audio.length));
    // Private: the audio is derived from text this user sent, and a shared proxy
    // has no business holding it. The browser may reuse it for a replay.
    res.setHeader("Cache-Control", "private, max-age=3600");
    // Surfaced so the client can show which voice is speaking without having to
    // repeat the resolution logic that chose it.
    res.setHeader("X-Speech-Voice", result.voice);
    res.setHeader("X-Speech-Speed", String(result.speed));

    res.status(200).send(result.audio);
  } catch (error) {
    next(error);
  }
};
