import Role from '../db/models/Role.js';
import User from '../db/models/User.js';
import { generateRoleID } from '../utils/uidGeneration.js';

// ======================
// Controllers
// ======================

// Add a new role
export const addRole = async (req, res) => {
  try {
    const { role } = req.body; 
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { role } });
    if (existingRole) {
      return res.status(409).json({ error: 'Role already exists' });
    }

    // Check if role is valid
    const validRoles = ['student', 'instructor', 'admin', 'auditor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const roleID = generateRoleID(role);
    // Create new role (roleId will auto-increment)
    const newRole = await Role.create({
       roleId: roleID,
       role
       });

    return res.status(201).json(newRole);
  } catch (err) {
    console.error('Add role error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


  // List all roles
export const listRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    return res.status(200).json(roles);
  } catch (err) {
    console.error("List roles error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};   

// Delete a role
export const deleteRole = async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Role ID is required' });
      }

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      await role.destroy();
      return res.status(204).send();
    } catch (err) {
      console.error('Delete role error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
};

// Assign role to user
export const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ error: 'User ID and Role ID are required' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Assign role to user
    user.roleId = roleId;
    await user.save();

    return res.status(200).json({ message: 'Role assigned to user successfully' });
  } catch (err) {
    console.error('Assign role to user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
