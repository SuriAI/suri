# SURI Model Training Log: YOLOv8n Pretrained with 600e+ from WIDERFACE, FDDB, MAFA & DARKFACE

> Raw logs of **SURI’s face detection model** trained on over **50,000 face annotations** from four major datasets. Training was done over roughly **336 hours** using a **T4 GPU** on **Google Colab**.

As of this model’s training, I’m still a **computer science student** without access to a high-end workstation. I trained the MVP version of **SURI** entirely on **Google Colab** using the **free-tier T4 GPU**. Because of the 4-hour session limits, I had to constantly monitor, restart, and checkpoint the training across multiple sessions. In total, it took around **336 hours (2 full weeks)** to complete the entire **[600e training cycle](https://github.com/johnraivenolazo/suri/tree/main/experiments/runs/train_wider300e_on_widerface-fddb-darkface-mafa_as-300e)**.

I stuck with this setup on purpose. The model meant to run in real-world, low-resource environments, so I made sure the training reflected that from the start.

---

## 🧠 TRAINING PROCESS

The training process started with the **YOLOv8n model**.

* **Phase 1**: Trained on the **WIDERFACE** dataset for **100 epochs** to establish a performance baseline. Here's the [validation result](https://github.com/johnraivenolazo/suri/blob/main/experiments/logs/metrics/yolov8n_widerface100e_val-widerface.txt):

  > **Precision:** 0.823
  > **Recall:** 0.566
  > **mAP\@0.5:** 0.640
  > **mAP\@0.5:0.95:** 0.342

  I didn’t continue with this model because the results weren’t great. Later I realized that **larger datasets** like WIDERFACE just need **more epochs** to start showing real gains. So I retrained it.

* **Phase 2**: Extended training to **[300 epochs on the same dataset](https://github.com/johnraivenolazo/suri/blob/main/experiments/models/wider300e.pt)** to improve generalization. This checkpoint became the [base model](https://github.com/johnraivenolazo/suri/blob/main/experiments/models/wider300e.pt) for all future fine-tuning.

* **Phase 3**: Using the 300e checkpoint, I trained it for another **300 epochs** on a **combined dataset** made from **WIDERFACE, FDDB, MAFA, and DARKFACE**, totaling **600 epochs overall**.
  Final training logs:
  • [Last epoch log](https://github.com/johnraivenolazo/suri/blob/main/experiments/runs/train_wider300e_on_widerface-fddb-darkface-mafa_as-300e/results.txt)
  • [Full result CSV](https://github.com/johnraivenolazo/suri/blob/main/experiments/runs/train_wider300e_on_widerface-fddb-darkface-mafa_as-300e/results.csv)

---

## ✅ VALIDATIONS

Validation was done in **two phases**. before and after fine-tuning. to compare performance across individual and merged datasets.

* The **base YOLOv8n model (300e on WIDERFACE)** scored:

  > **WIDERFACE**: Precision 0.861, Recall 0.599, mAP\@0.5 0.686, mAP\@0.5:0.95 0.385
  > **DARKFACE**: mAP\@0.5 just 0.130 (night-time scenes are tough)
  > **All datasets**: Precision 0.843, Recall 0.518, mAP\@0.5 0.596, mAP\@0.5:0.95 0.320

* After fine-tuning on **WIDER + FDDB + DARKFACE + MAFA** for another 300 epochs:

  > **DARKFACE** mAP\@0.5 jumped to **0.319**
  > **WIDERFACE** dipped slightly to 0.670
  > **All datasets**: mAP\@0.5 rose to **0.613**

🔗 Full validation comparison logs: [comparison\_raw.txt](https://github.com/johnraivenolazo/suri/blob/main/experiments/validate/comparison_raw.txt)

---

### 📊 Model Validation Comparison

| Dataset                    | Metric                  | **Base Model** (WIDER only) | **Finetuned Model** (WIDER+FDDB+DARKFACE+MAFA) |
| --------------------- | ------------------- | --------------------------------- | ---------------------------------------------------------------  |
| **WIDERFACE**      | Precision              | 0.861                                        | 0.852                                          |
|                                 | Recall                   | 0.599                                         | 0.587                                          |
|                                 | mAP\@0.5           | 0.686                                         | 0.670                                          |
|                                 | mAP\@0.5:0.95   | 0.385                                         | 0.374                                          |
| **DARKFACE**        | Precision             | 0.528                                         | 0.581                                          |
|                                 |                             |                                                  |                                                    |
|                                 | Recall                   | 0.109                                        | 0.294                                          |
|                                 | mAP\@0.5           | 0.130                                        | 0.319                                          |
|                                 | mAP\@0.5:0.95   | 0.041                                         | 0.132                                          |
| **ALL DATASETS** | Precision             | 0.843                                         | 0.826                                          |
|                                 | Recall                  | 0.518                                         | 0.538                                          |
|                                 | mAP\@0.5          | 0.596                                         | 0.613                                          |
|                                 |  mAP\@0.5:0.95  | 0.320                                         | 0.338                                          |


**Note:** Fine-tuning on **WIDER + FDDB + DARKFACE + MAFA** gave the model a **serious boost**. **DARKFACE mAP\@0.5 more than doubled**!!. Yeah, **WIDERFACE** dipped a bit, but not enough to care. Overall, the fine-tuned model just handles more diverse and harder samples better.

![Results](https://raw.githubusercontent.com/johnraivenolazo/suri/main/experiments/runs/train_wider300e_on_widerface-fddb-darkface-mafa_as-300e/results.png)

---

## ❓ What is the goal of training our own model instead of relying only on a pretrained one?

The goal was to build a **face detection model** that actually works in **real-world classroom environments**. That means:

* Weird angles, Occlusions masks, hair, shadows ![](https://raw.githubusercontent.com/johnraivenolazo/suri/main/experiments/validate/val-wider300e%2B300e-unisets_on_wider%20(BASE%20%2B%20FINETUNED)/val_batch0_pred.jpg)
* Low light ![](https://raw.githubusercontent.com/johnraivenolazo/suri/main/experiments/validate/val-wider300e%2B300e-unisets_on_darkface%20(BASE%20%2B%20FINETUNED)/val_batch1_pred.jpg)

Generic pretrained models couldn’t handle these edge cases consistently. Training our own allowed us to **tailor the model** to these challenges.

---

## ❓ Why we continued training the model instead of relying on the base pretrained version

We started with a **YOLOv8n pretrained on COCO**, then trained for **300 epochs on [WIDERFACE](https://shuoyang1213.me/WIDERFACE)**. While exploring **Roboflow’s open datasets** under the "faces" class, I found others that were a perfect match for SURI’s use case.

To **improve accuracy** across lighting, occlusion, and pose variations, I extended training another **300 epochs** using a merged dataset of **WIDERFACE, FDDB, DARKFACE, and MAFA**, totalling **50k+ images**.

---

## ❓ Why use the nano version (v8n) instead of s, m, l, or x models?

I seriously considered using **YOLOv8s** and **YOLOv8m**, but after checking the **[official Ultralytics benchmarks](https://docs.ultralytics.com/models/yolov8/)**, **YOLOv8n** had the best **speed-to-accuracy trade-off** for low-end environments.

SURI is meant to run on **standard laptops and classroom PCs** — not gaming rigs. Larger models like **v8m** or **v8l** need way more memory and compute. That would’ve made SURI less accessible.

**YOLOv8n hits real-time speeds** while keeping size and memory low. With dataset-specific training, it gets **good accuracy** without sacrificing **speed or deployability**.

---

## 🗃️ Dataset Details

### ✅ Datasets Used:

* **WIDERFACE (Base)** – [http://shuoyang1213.me/WIDERFACE](http://shuoyang1213.me/WIDERFACE)
* **FDDB (Fine-tuning)** – [Roboflow Download](https://universe.roboflow.com/fddb/face-detection-40nq0/dataset/1/download)
* **DARKFACE (Low-light)** – [Roboflow Download](https://universe.roboflow.com/school-g4vy0/dark_face_detection/dataset/1)
* **MAFA (Masked Faces)** – [Kaggle](https://www.kaggle.com/datasets/revanthrex/mafadataset)

> **Note:** All annotations were **converted to [YOLO format](https://yolov8.org/yolov8-label-format/)**, manually cleaned for broken labels, and **merged into a single unified dataset (uniset)** with over **50,000** diverse face annotations.

---

## 🗂 Folder Structure

```
experiments/
├── models/       # best.pt, last.pt
├── logs/         # TensorBoard logs, config YAMLs
├── runs/         # Trained Model
├── validate/     # PR curves, confusion matrix, etc.
```
