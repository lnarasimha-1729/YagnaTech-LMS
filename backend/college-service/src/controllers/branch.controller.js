import Branch from "../db/models/Branch.js";
import College from "../db/models/College.js";

// Add new branch
export async function addBranch(req, res) {
  try {
    const { branchId, branchName } = req.body;

    if (!branchId || !branchName) {
      return res.status(400).json({ message: "branchId and branchName are required" });
    }

    const existing = await Branch.findByPk(branchId);
    if (existing) {
      return res.status(409).json({ message: "Branch with this ID already exists" });
    }

    const branch = await Branch.create({ branchId, branchName });
    res.status(201).json(branch);
  } catch (error) {
    console.error("Error adding branch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all branches
export async function getAllBranches(req, res) {
  try {
    const branches = await Branch.findAll();
    res.json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update branch
export async function updateBranch(req, res) {
  try {
    const { branchId } = req.params;
    const { branchName } = req.body;

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.update({ branchName });
    res.json(branch);
  } catch (error) {
    console.error("Error updating branch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Delete branch
export async function deleteBranch(req, res) {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.destroy();
    res.status(200).send({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ Assign branch IDs to a college (update JSON column)
export async function assignBranchesToCollege(req, res) {
  try {
    const { clgId, branchIds } = req.body;

    if (!clgId || !Array.isArray(branchIds)) {
      return res.status(400).json({ message: "clgId and branchIds[] are required" });
    }

    const college = await College.findByPk(clgId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // ✅ Ensure branches exist
    const branches = await Branch.findAll({ where: { branchId: branchIds } });
    if (branches.length !== branchIds.length) {
      return res.status(400).json({ message: "Some branches not found" });
    }

    // ✅ Save branchIds in College table (JSON array)
    await college.update({ branchIds });

    res.json({ 
      message: "Branches assigned successfully", 
      college: { ...college.toJSON(), branchIds } 
    });
  } catch (error) {
    console.error("Error assigning branches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}