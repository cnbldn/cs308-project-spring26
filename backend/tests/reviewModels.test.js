const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Review Models (Comment & Rating) Unit Tests', () => {
    const mockId = new mongoose.Types.ObjectId();

    describe('Comment Model', () => {
        it('should create a valid pending comment by default', async () => {
            const comment = new Comment({
                product: mockId,
                customer: mockId,
                text: 'Great game!'
            });
            const saved = await comment.save();
            expect(saved.text).toBe('Great game!');
            expect(saved.status).toBe('pending');
        });

        it('should fail if comment text is missing', async () => {
            const comment = new Comment({
                product: mockId,
                customer: mockId
            });
            let err;
            try {
                await comment.save();
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.errors.text).toBeDefined();
        });
    });

    describe('Rating Model', () => {
        it('should create a valid rating', async () => {
            const rating = new Rating({
                product: mockId,
                customer: mockId,
                value: 5
            });
            const saved = await rating.save();
            expect(saved.value).toBe(5);
        });

        it('should fail if rating value is greater than 5', async () => {
            const rating = new Rating({
                product: mockId,
                customer: mockId,
                value: 6
            });
            let err;
            try {
                await rating.save();
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(err.errors.value).toBeDefined();
        });
    });
});
