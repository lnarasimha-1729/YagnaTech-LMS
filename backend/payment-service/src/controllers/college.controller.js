import College from '../db/models/College.js';
import Branch from '../db/models/Branch.js';
import { generateCollegeId, generateAccessKey } from '../utils/uidGeneration.js';

// Add a new college
export async function addCollege(req, res) {
  try {
    const { clgName } = req.body;
    const clgId = generateCollegeId();
    const accesskey = generateAccessKey();
    if (!clgName) {
      return res.status(400).json({ message: 'clgName is required' });
    }
    const existingClg = await College.findByPk(clgId);
    if (existingClg) {
      return res.status(409).json({ message: 'College with this ID already exists' });
    }
    const newClg = await College.create({ clgId, clgName, accesskey });
    res.status(201).json(newClg);
  } catch (error) {
    console.error('Error adding college:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get college by ID
// export async function getCollegeById(req, res) {
//   try {
//     const { clgId } = req.params;
//     const college = await College.findByPk(clgId, {
//       attributes: ['clgId', 'clgName', 'clgAddress', 'orgId', 'branchIds', 'createdAt', 'updatedAt']
//     });
//     if (!college) {
//       return res.status(404).json({ message: 'College not found' });
//     }
//     res.json(college);
//   } catch (error) {
//     console.error('Error fetching college by ID:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

// Get college by ID (with branch names)
export async function getCollegeById(req, res) {
  try {
    const { clgId } = req.params;

    const college = await College.findByPk(clgId, {
      attributes: ['clgId', 'clgName', 'clgAddress', 'orgId', 'branchIds', 'createdAt', 'updatedAt']
    });

    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    let branches = [];
    if (college.branchIds && college.branchIds.length > 0) {
      branches = await Branch.findAll({
        where: { branchId: college.branchIds },
        attributes: ['branchId', 'branchName']
      });
    }

    res.json({
      ...college.toJSON(),
      branches // will contain [{ branchId, branchName }]
    });

  } catch (error) {
    console.error('Error fetching college by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get all colleges (Admin only)
export async function getAllColleges(req, res) {
  console.log("getAllColleges called by user:", req.user);
  try {
    const colleges = await College.findAll();
    if (colleges.length === 0) {
      return res.status(404).json({ message: 'No colleges found' });
    }
    res.json(colleges);
  } catch (error) {
    console.error('Error fetching all colleges:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update college details
export async function updateCollege(req, res) {
  try {
    const { clgId } = req.params;
    const { accesskey, clgName, clgAddress, orgId } = req.body;
    console.log("Update request by user:", req.body);

    if (!accesskey) {
      return res.status(400).json({ message: 'accesskey needed to update college details' });
    }

    const college = await College.findByPk(clgId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    } 

    //check accesskey matches
    if (college.accesskey !== accesskey) {
      return res.status(403).json({ message: 'Invalid access key' });
     }

    await college.update({ clgName, clgAddress, orgId });
    res.json(college);
  } catch (error) {
    console.error('Error updating college:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete a college
export async function deleteCollege(req, res) {
  try {
    const { clgId } = req.params;
    const college = await College.findByPk(clgId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    await college.destroy();
    res.status(200).send({ message: 'College deleted successfully' });
  } catch (error) {
    console.error('Error deleting college:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
