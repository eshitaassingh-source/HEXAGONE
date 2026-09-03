"""
Zero-DCE: lightweight low-light image enhancement network.
Reimplementation of the architecture from:
Guo et al., "Zero-Reference Deep Curve Estimation for Low-Light Image
Enhancement", CVPR 2020.

Use the official pretrained weights (Epoch99.pth) from:
https://github.com/Li-Chongyi/Zero-DCE
(academic / research use license)
"""

import torch
import torch.nn as nn
import numpy as np


class DCENet(nn.Module):
    def __init__(self):
        super().__init__()
        self.relu = nn.ReLU(inplace=True)
        nf = 32
        self.e_conv1 = nn.Conv2d(3, nf, 3, 1, 1, bias=True)
        self.e_conv2 = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.e_conv3 = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.e_conv4 = nn.Conv2d(nf, nf, 3, 1, 1, bias=True)
        self.e_conv5 = nn.Conv2d(nf * 2, nf, 3, 1, 1, bias=True)
        self.e_conv6 = nn.Conv2d(nf * 2, nf, 3, 1, 1, bias=True)
        self.e_conv7 = nn.Conv2d(nf * 2, 24, 3, 1, 1, bias=True)

    def forward(self, x):
        x1 = self.relu(self.e_conv1(x))
        x2 = self.relu(self.e_conv2(x1))
        x3 = self.relu(self.e_conv3(x2))
        x4 = self.relu(self.e_conv4(x3))
        x5 = self.relu(self.e_conv5(torch.cat([x3, x4], 1)))
        x6 = self.relu(self.e_conv6(torch.cat([x2, x5], 1)))
        x_r = torch.tanh(self.e_conv7(torch.cat([x1, x6], 1)))

        r1, r2, r3, r4, r5, r6, r7, r8 = torch.split(x_r, 3, dim=1)
        x = x + r1 * (torch.pow(x, 2) - x)
        x = x + r2 * (torch.pow(x, 2) - x)
        x = x + r3 * (torch.pow(x, 2) - x)
        x = x + r4 * (torch.pow(x, 2) - x)
        x = x + r5 * (torch.pow(x, 2) - x)
        x = x + r6 * (torch.pow(x, 2) - x)
        x = x + r7 * (torch.pow(x, 2) - x)
        enhanced = x + r8 * (torch.pow(x, 2) - x)
        return enhanced


def load_model(weights_path="Epoch99.pth", device="cpu"):
    model = DCENet().to(device)
    state_dict = torch.load(weights_path, map_location=device)
    model.load_state_dict(state_dict)
    model.eval()
    return model


def enhance_frame(frame_bgr, model, device="cpu"):
    """Takes an OpenCV BGR frame (uint8, HxWx3), returns an enhanced BGR frame."""
    rgb = frame_bgr[:, :, ::-1].astype(np.float32) / 255.0
    tensor = torch.from_numpy(rgb.copy()).permute(2, 0, 1).unsqueeze(0).to(device)
    with torch.no_grad():
        out = model(tensor)
    out = out.squeeze(0).permute(1, 2, 0).clamp(0, 1).cpu().numpy()
    out_bgr = (out[:, :, ::-1] * 255.0).astype(np.uint8)
    return out_bgr


def is_dark(frame_bgr, threshold=70):
    """Quick brightness check (mean grayscale value) to decide if enhancement is needed."""
    import cv2
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    return gray.mean() < threshold