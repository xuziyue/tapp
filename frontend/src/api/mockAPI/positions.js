import {
    find,
    getAttributesCheckMessage,
    deleteInArray,
    findAllById,
    MockAPIController
} from "./utils";
import {
    documentCallback,
    wrappedPropTypes,
    docApiPropTypes
} from "../defs/doc-generation";
import { Session } from "./sessions";

export class Position extends MockAPIController {
    constructor(data) {
        super(data, data.positions);
    }
    validateNew(position, session = null) {
        // If we're inserting to a session, the position_code must be unique
        if (session) {
            const message = getAttributesCheckMessage(
                position,
                this.findAllBySession(session),
                {
                    position_code: { required: true, unique: true }
                }
            );
            if (message) {
                throw new Error(message);
            }
        }
    }
    delete(position) {
        const matchingPosition = this.rawFind(position);
        if (!matchingPosition) {
            throw new Error(
                `Cannot find position matching ${JSON.stringify(position)}`
            );
        }
        super.delete(matchingPosition);
        // After an instructor is deleted, they should be removed from all courses

        // remove this instructor from any positions
        for (const bySessionsList of Object.values(
            this.data.positions_by_session
        )) {
            if (bySessionsList.includes(matchingPosition.id)) {
                deleteInArray(matchingPosition.id, bySessionsList);
            }
        }
        return matchingPosition;
    }
    findAllBySession(session) {
        const matchingSession = new Session(this.data).find(session);
        return findAllById(
            this.data.positions_by_session[matchingSession.id] || [],
            this.ownData
        );
    }
    upsertBySession(obj, session) {
        const matchingSession = new Session(this.data).rawFind(session);
        // If this is not an upsert, validate the paramters. Otherwise, don't validate.
        if (!this.rawFind(obj)) {
            this.validateNew(obj, matchingSession);
        }
        const newPosition = this.upsert(obj);
        // Make sure there is an array for to store the contract_templates by session,
        // and the push to this array before returning the new object
        this.data.positions_by_session[matchingSession.id] =
            this.data.positions_by_session[matchingSession.id] || [];
        this.data.positions_by_session[matchingSession.id].push(newPosition.id);
        return newPosition;
    }
    findAssociatedSession(position) {
        const matchingPosition = this.find(position);
        if (!matchingPosition) {
            throw new Error(
                `Could not associated session because there is no position matching ${JSON.stringify(
                    position
                )}`
            );
        }
        const ret = Object.keys(this.data.positions_by_session).find(x =>
            this.data.positions_by_session[x].includes(matchingPosition.id)
        );
        // Make sure we recast the id as an int
        return ret != null ? +ret : ret;
    }
}

export const positionsRoutes = {
    get: {
        "/sessions/:session_id/positions": documentCallback({
            func: (data, params) =>
                new Position(data).findAllBySession(params.session_id),
            summary: "Get positions associated with this session.",
            returns: wrappedPropTypes.arrayOf(docApiPropTypes.position)
        })
    },
    post: {
        "/sessions/:session_id/positions": documentCallback({
            func: (data, params, body) => {
                return new Position(data).upsertBySession(
                    body,
                    params.session_id
                );
            },
            summary:
                "Upsert a position associated with a session. If a new position is created, it will be automatically associated with the given session",
            posts: docApiPropTypes.position,
            returns: docApiPropTypes.position
        }),
        "/positions": documentCallback({
            func: (data, params, body) => {
                const positions = data.positions;
                // body should be a session object. If it contains an id,
                // update an existing session. Otherwise, create a new one.
                const matchingPosition = find(body, positions);
                if (matchingPosition) {
                    return Object.assign(matchingPosition, body);
                }
                throw new Error(`Cannot find position with id=${body.id}`);
            },
            summary: "Update a position",
            posts: docApiPropTypes.position,
            returns: docApiPropTypes.position
        }),
        "/positions/delete": documentCallback({
            func: (data, params, body) => {
                return new Position(data).delete(body);
            },
            summary: "Delete a position",
            posts: docApiPropTypes.idOnly,
            returns: docApiPropTypes.session
        })
    }
};
