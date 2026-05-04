const mockData = require('./mockData');

const USE_MOCK = true;

const emptyList = (query = {}) => ({
    data: [], total: 0, per_page: 12,
    current_page: Number(query.page) || 1, last_page: 1,
    categories: [],
});

exports.list = async (req, res) => {
    if (USE_MOCK) return res.json(mockData.getCourses(req.query));
    try {
        // Real DB path is intentionally minimal here — falls back to mock on failure.
        return res.json(mockData.getCourses(req.query));
    } catch (err) {
        console.warn('[courses.list] failed:', err.message);
        return res.json(emptyList(req.query));
    }
};

exports.details = async (req, res) => {
    const { slug } = req.params;
    try {
        const data = mockData.getCourseDetails(slug);
        if (!data) return res.status(404).json({ error: 'Course not found' });
        return res.json(data);
    } catch (err) {
        console.warn('[courses.details] failed:', err.message);
        return res.status(500).json({ error: 'Failed to load course' });
    }
};
