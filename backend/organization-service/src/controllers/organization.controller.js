import Organization from '../db/models/Organization.js';
import { generateOrganizationId, generateAccessKey } from '../utils/uidGeneration.js';

// Add a new organization
export async function addOrganization(req, res) {
  try {
    const { orgName } = req.body;
    const orgId = generateOrganizationId();
    const accesskey = generateAccessKey();
    if (!orgName) {
      return res.status(400).json({ message: 'orgName is required' });
    }
    const existingOrg = await Organization.findByPk(orgId);
    if (existingOrg) {
      return res.status(409).json({ message: 'Organization with this ID already exists' });
    }
    const newOrg = await Organization.create({ orgId, orgName, accesskey });
    res.status(201).json(newOrg);
  } catch (error) {
    console.error('Error adding organization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get organization by ID
export async function getOrganizationById(req, res) {
  try {
    const { orgId } = req.params;
    const organization = await Organization.findByPk(orgId, {
      attributes: ['orgId', 'orgName', 'orgState', 'orgCountry', 'orgAddress', 'orgPin', 'createdAt', 'updatedAt']
    });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get all organizations (Admin only)
export async function getAllOrganizations(req, res) {
  try {
    const organizations = await Organization.findAll();
    if (organizations.length === 0) {
      return res.status(404).json({ message: 'No organizations found' });
    }
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching all organizations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update organization details
export async function updateOrganization(req, res) {
  try {
    const { orgId } = req.params;
    const { accesskey, orgName, orgState, orgCountry, orgAddress, orgPin } = req.body;

    if (!accesskey) {
      return res.status(400).json({ message: 'accesskey needed to update organization details' });
    }

    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    } 

    //check accesskey matches
    if (organization.accesskey !== accesskey) {
      return res.status(403).json({ message: 'Invalid access key' });
     }

    await organization.update({ orgName, orgState, orgCountry, orgAddress, orgPin });
    res.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete an organization
export async function deleteOrganization(req, res) {
  try {
    const { orgId } = req.params;
    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    await organization.destroy();
    res.status(200).send({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
